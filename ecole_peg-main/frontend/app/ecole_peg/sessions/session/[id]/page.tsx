"use client";

import { Button } from "@/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { ArrowLeft, Calendar, Users, Bookmark } from "lucide-react";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Session {
  id: number;
  cours__nom: string;
  cours__type_cours: "I" | "S";
  cours__niveau: "A1" | "A2" | "B1" | "B2" | "C1";
  date_debut: Date;
  date_fin: Date;
  capacite_max: number;
  statut: "O" | "F";
  periode_journee: "M" | "S" | "A";
  seances_mois: number;
  enseignant__nom: string;
  enseignant__prenom: string;
}

interface FichePresence {
  id: number;
  mois: string;
  annee: number;
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);

  const [session, setSession] = useState<Session>();
  const [fiches, setFiches] = useState<FichePresence[]>([]);

  const fetchFiches = useCallback(async () => {
    try {
      const reponse = await api.get<FichePresence[]>(
        `/cours/session/${resolvedParams.id}/fiches_presences/`,
      );

      setFiches(reponse.data);
    } catch (err) {
      console.error("Erreur lors du chargement des fiches: ", err);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchFiches();
  }, [fetchFiches]);

  useEffect(() => {
    async function fetchSession() {
      try {
        const reponse = await api.get<Session>(
          `/cours/sessions/${resolvedParams.id}`,
        );

        setSession(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    fetchSession();
  }, [resolvedParams.id]);

  async function supprimerSession() {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette session ?")) {
      return;
    }

    try {
      await api.delete(`/cours/sessions/${resolvedParams.id}/`);

      router.push("/ecole_peg/sessions/");
    } catch (err) {
      console.error("Erreur: ", err);

      alert("Une erreur est survenue lors de la suppression de la session.");
    }
  }

  async function supprimerFiche(id_fiche: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette fiche de présences ?")) {
      return;
    }

    try {
      await api.delete(`/cours/fiche_presences/${id_fiche}/`);

      fetchFiches();
    } catch (err) {
      console.error("Erreur: ", err);

      alert("Une erreur est survenue lors de la suppression de la fiche de présences.");
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/ecole_peg/sessions/")}
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {session?.cours__nom}
          </h1>
          <p className="text-muted-foreground">
            {session?.cours__type_cours === "I" ? "Intensif" : "Semi-intensif"}{" "}
            - Niveau {session?.cours__niveau}
          </p>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-card">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="fiche">Fiche de présences</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Détails de la session</CardTitle>
                  <CardDescription>
                    Informations sur la session en cours
                  </CardDescription>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    session?.statut === "O"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {session?.statut === "O"
                    ? "Session ouverte"
                    : "Session fermée"}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Période
                      </p>
                      <p className="text-sm">
                        {session?.date_debut && session?.date_fin ? (
                          <>
                            Du {formatDate(session.date_debut)} au{" "}
                            {formatDate(session.date_fin)}
                          </>
                        ) : (
                          "Dates non définies"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Type
                      </p>
                      <p className="text-sm">
                        {session?.cours__type_cours === "I"
                          ? "Intensif"
                          : "Semi-intensif"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Enseignant
                      </p>
                      <p className="text-sm">
                        {session?.enseignant__nom} {session?.enseignant__prenom}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Capacité max
                      </p>
                      <p className="text-sm">{session?.capacite_max ?? "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Niveau
                      </p>
                      <p className="text-sm">{session?.cours__niveau}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Période journée
                      </p>
                      <p className="text-sm">
                        {session?.periode_journee === "M"
                          ? "Matin"
                          : session?.periode_journee === "S"
                            ? "Soir"
                            : session?.periode_journee === "A"
                            ? "Apres-midi"
                            : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Séances par mois
                      </p>
                      <p className="text-sm">{session?.seances_mois ?? "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-end border-t px-6 py-4 bg-muted/50 space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  router.push(
                    `/ecole_peg/sessions/session/${resolvedParams.id}/modifier`,
                  );
                }}
              >
                Modifier
              </Button>
              <Button variant="destructive" onClick={() => supprimerSession()}>
                Supprimer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="fiche">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Fiche de présences</CardTitle>
              <CardDescription>
                Gestion des fiches de présences pour cette session
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead>Mois</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fiches.length > 0 ? (
                    fiches.map((fiche) => (
                      <TableRow key={fiche.id} className="hover:bg-muted/50">
                        <TableCell>
                          {format(fiche.mois, "MMMM", { locale: fr })
                            .charAt(0)
                            .toUpperCase() +
                            format(fiche.mois, "MMMM", { locale: fr }).slice(1)}
                        </TableCell>
                        <TableCell>{fiche.annee}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              router.push(
                                `${resolvedParams.id}/fiche/${fiche.id}`,
                              );
                            }}
                          >
                            Consulter
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => supprimerFiche(fiche.id)}
                          >
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Aucune fiche de présence trouvée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-between border-t px-6 py-4 bg-muted/50">
              <Button
                variant="default"
                onClick={() => {
                  router.push(
                    `/ecole_peg/sessions/session/${resolvedParams.id}/fiche`,
                  );
                }}
                // disabled={session?.statut === "O"}
              >
                Nouvelle fiche de présence
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
