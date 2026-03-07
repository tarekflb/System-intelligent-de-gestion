"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  BookOpen,
  Cake,
  Clock,
  Coins,
  FileText,
  Home,
  PieChart,
  UserMinus,
  UserPlus,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { AlertBox } from "@/components/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { formatDate } from "@/lib/utils";

interface Anniversaire {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: Date;
  age: number;
}

interface SessionOuverte {
  date_debut: Date;
  eleves_restants: number;
}

interface ElevePresenceInferieur {
  nom: string;
  prenom: string;
  date_naissance: Date;
  taux_presence: number;
}

interface ElevePreinscription {
  nom: string;
  prenom: string;
  date_naissance: Date;
}

type Niveau = "A1" | "A2" | "B1" | "B2" | "C1";

interface FactureDetail {
  id: number;
  date_emission: Date;
  montant_total: number;
  montant_restant: number;
  eleve_nom: string;
  eleve_prenom: string;
}

interface RepartitionCours {
  inscriptions__session__cours__nom: string;
  inscriptions__session__cours__type_cours: string;
  inscriptions__session__cours__niveau: Niveau;
  total: number;
}

interface Stats {
  factures: {
    nombre_factures_impayees: number;
    montant_total_paiements_mois: number;
    montant_total_factures_impayees: number;
    factures_impayees_plus_5j: FactureDetail[];
  };
  cours: {
    total_cours: number;
    sessions_actives: number;
    cours_prives_programmes_mois: number;
    sessions_ouvertes: SessionOuverte[];
    nombre_enseignants: number;
    repartition_eleves_actifs: RepartitionCours[];
  };
  eleves: {
    total_eleves: number;
    eleves_actifs: number;
    pays_plus_eleves: string | null;
    eleves_presence_inferieur_80: ElevePresenceInferieur[];
    eleves_preinscription_plus_3j: ElevePreinscription[];
  };
}

export default function TableauBordPage() {
  const [stats, setStats] = useState<Stats>();
  const [anniversaires, setAnniversaires] = useState<Anniversaire[]>([]);
  const [chargement, setChargement] = useState(true);

  // ⬇️ Sélection du mois (1..12) + année courante
  const [moisSel, setMoisSel] = useState<number>(new Date().getMonth() + 1);
  const anneeCourante = new Date().getFullYear();

  // Libellé du mois sélectionné
  const moisLibelle = format(
    new Date(anneeCourante, moisSel - 1, 1),
    "MMMM yyyy",
    { locale: fr }
  );

  // 🔹 Récupérer les stats (1 seule fois)
  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        setChargement(true);
        const reponse_stats = await api.get<Stats>(
          "/eleves/statistiques/dashboard/"
        );
        if (mounted) setStats(reponse_stats.data);
      } catch (err) {
        console.error("Erreur (stats): ", err);
      } finally {
        if (mounted) setChargement(false);
      }
    }
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  // 🔹 Récupérer les anniversaires selon le mois sélectionné
  useEffect(() => {
    let mounted = true;
    async function fetchAnniversaires() {
      try {
        setChargement(true);
        const reponse_anniv = await api.get<Anniversaire[]>(
          `/eleves/anniversaires/?mois=${moisSel}&annee=${anneeCourante}`
        );
        if (mounted) setAnniversaires(reponse_anniv.data);
      } catch (err) {
        console.error("Erreur (anniversaires): ", err);
      } finally {
        if (mounted) setChargement(false);
      }
    }
    fetchAnniversaires();
    return () => {
      mounted = false;
    };
  }, [moisSel, anneeCourante]);

  if (chargement)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );

  if (!stats) return <p>Aucune donnée disponible.</p>;

  const factures_impayees = stats.factures.nombre_factures_impayees;
  const eleves_absence = stats.eleves.eleves_presence_inferieur_80.length;
  const eleves_preinscription =
    stats.eleves.eleves_preinscription_plus_3j.length;
  const nombreAlertes =
    (factures_impayees ? 1 : 0) +
    (eleves_absence ? 1 : 0) +
    (eleves_preinscription ? 1 : 0);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenue dans le système de gestion de l&apos;École PEG
        </p>
      </div>

      <Tabs defaultValue="apercu" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="apercu" className="flex items-center">
            <Home className="mr-2 h-4 w-4" /> Aperçu
          </TabsTrigger>
          <TabsTrigger value="alertes" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" /> Alertes
            {nombreAlertes > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-700">
                {nombreAlertes}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apercu" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:bg-accent/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Élèves actifs
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.eleves.eleves_actifs}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  sur {stats.eleves.total_eleves} élèves au total
                </p>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Enseignants
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.cours.nombre_enseignants}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total des cours
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.cours.total_cours}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  dont {stats.cours.sessions_actives} sessions ouvertes
                </p>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cours privés ce mois
                </CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.cours.cours_prives_programmes_mois}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">
                  Répartition des cours
                </CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cours</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Élèves</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.cours.repartition_eleves_actifs.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {r["inscriptions__session__cours__nom"]}
                        </TableCell>
                        <TableCell>
                          {r["inscriptions__session__cours__type_cours"] === "I"
                            ? "Intensif"
                            : "Semi-intensif"}
                        </TableCell>
                        <TableCell>
                          {r["inscriptions__session__cours__niveau"]}
                        </TableCell>
                        <TableCell>{r.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Finances</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">
                    Montant reçu (mois)
                  </p>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">
                      {stats.factures.montant_total_paiements_mois.toLocaleString(
                        "fr-FR",
                        {
                          style: "currency",
                          currency: "CHF",
                        }
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-700">
                    Montant impayé (total)
                  </p>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">
                      {stats.factures.montant_total_factures_impayees.toLocaleString(
                        "fr-FR",
                        {
                          style: "currency",
                          currency: "CHF",
                        }
                      )}
                    </span>
                  </div>
                  {/* Si ton backend renvoie aussi `nombre_factures_impayees`, tu peux afficher le nombre : */}
                  {/* <p className="text-xs text-muted-foreground">
          {stats.factures.nombre_factures_impayees} facture(s) impayée(s)
        </p> */}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  Pays principal
                </span>
                <span className="font-medium">
                  {Array.isArray(stats.eleves.pays_plus_eleves)
                    ? stats.eleves.pays_plus_eleves.length
                      ? stats.eleves.pays_plus_eleves.join(", ")
                      : "Non défini"
                    : stats.eleves.pays_plus_eleves || "Non défini"}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">
                  Sessions ouvertes
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stats.cours.sessions_ouvertes.length > 0 ? (
                  <div className="space-y-4">
                    {stats.cours.sessions_ouvertes.map((s, index) => (
                      <div
                        key={`session-${index}-${new Date(
                          s.date_debut
                        ).toISOString()}`}
                        className="flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {format(new Date(s.date_debut), "dd MMMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {s.eleves_restants} places disponibles
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune session ouverte.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center space-x-2">
                  <Cake className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-medium">
                    Anniversaires du mois
                  </CardTitle>
                </div>

                {/* ⬇️ Contrôles de sélection du mois */}
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md border px-2 py-1 text-sm hover:bg-muted"
                    onClick={() => setMoisSel((m) => (m === 1 ? 12 : m - 1))}
                    aria-label="Mois précédent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <select
                    className="rounded-md border px-2 py-1 text-sm capitalize bg-background"
                    value={moisSel}
                    onChange={(e) => setMoisSel(Number(e.target.value))}
                    aria-label="Sélection du mois"
                  >
                    {[
                      "janvier",
                      "février",
                      "mars",
                      "avril",
                      "mai",
                      "juin",
                      "juillet",
                      "août",
                      "septembre",
                      "octobre",
                      "novembre",
                      "décembre",
                    ].map((m, i) => (
                      <option key={m} value={i + 1} className="capitalize">
                        {m}
                      </option>
                    ))}
                  </select>

                  <button
                    className="rounded-md border px-2 py-1 text-sm hover:bg-muted"
                    onClick={() => setMoisSel((m) => (m === 12 ? 1 : m + 1))}
                    aria-label="Mois suivant"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mb-3 text-sm text-muted-foreground capitalize">
                  {moisLibelle}
                </div>

                {anniversaires.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun anniversaire ce mois-ci.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {anniversaires.map((anniv) => (
                      <div
                        key={anniv.id}
                        className="flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {anniv.nom} {anniv.prenom}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(anniv.date_naissance)} — {anniv.age} ans
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alertes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertes système</CardTitle>
              <CardDescription>
                Notifications importantes nécessitant votre attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {factures_impayees > 0 && (
                <AlertBox
                  variant="error"
                  title="Factures impayées"
                  icon={<FileText className="h-5 w-5" />}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      {factures_impayees}{" "}
                      {factures_impayees > 1
                        ? "factures impayées"
                        : "facture impayée"}{" "}
                      pour un montant total de{" "}
                      {stats.factures.montant_total_factures_impayees.toLocaleString(
                        "fr-FR",
                        { style: "currency", currency: "CHF" }
                      )}
                    </p>
                    <span className="text-2xl font-bold">
                      {factures_impayees}
                    </span>
                  </div>
                </AlertBox>
              )}

              {stats.factures.factures_impayees_plus_5j.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">
                    Factures impayées depuis 5 jours
                  </h3>
                  <ul className="space-y-1">
                    {stats.factures.factures_impayees_plus_5j.map((inv) => (
                      <li key={inv.id} className="flex justify-between">
                        <div>
                          <strong>
                            {inv.eleve_prenom} {inv.eleve_nom}
                          </strong>
                          <br />
                          N° {inv.id} — émis le{" "}
                          {format(new Date(inv.date_emission), "dd/MM/yyyy")}
                        </div>
                        <div className="text-right">
                          Total:{" "}
                          {inv.montant_total.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "CHF",
                          })}
                          <br />
                          Restant:{" "}
                          {inv.montant_restant.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "CHF",
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {eleves_absence > 0 && (
                <div className="space-y-4">
                  <AlertBox
                    variant="warning"
                    title="Faible taux de présence"
                    icon={<UserMinus className="h-5 w-5" />}
                  >
                    <p className="text-sm">
                      {eleves_absence}{" "}
                      {eleves_absence > 1 ? "élèves ont" : "élève a"} un taux de
                      présence inférieur à 80%
                    </p>
                  </AlertBox>

                  <Card className="p-4">
                    <div className="space-y-4">
                      {stats.eleves.eleves_presence_inferieur_80.map(
                        (eleve, index) => (
                          <div
                            key={`presence-${eleve.nom}-${eleve.prenom}-${index}`}
                            className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                          >
                            <div>
                              <p className="font-medium">
                                {eleve.prenom} {eleve.nom}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Taux : {eleve.taux_presence.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {eleves_preinscription > 0 && (
                <div className="space-y-4">
                  <AlertBox
                    variant="info"
                    title="Préinscriptions en attente"
                    icon={<Clock className="h-5 w-5" />}
                  >
                    <p className="text-sm">
                      {eleves_preinscription}{" "}
                      {eleves_preinscription > 1 ? "élèves sont" : "élève est"}{" "}
                      en attente de confirmation depuis plus de 3 jours
                    </p>
                  </AlertBox>

                  <Card className="p-4">
                    <div className="space-y-4">
                      {stats.eleves.eleves_preinscription_plus_3j.map(
                        (eleve, index) => (
                          <div
                            key={`preinscription-${eleve.nom}-${eleve.prenom}-${index}`}
                            className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                          >
                            <div>
                              <p className="font-medium">
                                {eleve.prenom} {eleve.nom}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Né(e) le{" "}
                                {format(
                                  new Date(eleve.date_naissance),
                                  "dd/MM/yyyy"
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {nombreAlertes === 0 && (
                <AlertBox variant="success" title="Système à jour">
                  <p className="text-sm">
                    Aucune alerte à signaler pour le moment.
                  </p>
                </AlertBox>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
