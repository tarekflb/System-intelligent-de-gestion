"use client";

import Link from "next/link";
import { Button } from "@/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { ArrowLeft, FileText } from "lucide-react";
import React, { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { parseISO } from "date-fns/parseISO";
import { isValid } from "date-fns/isValid";
import { format } from "date-fns/format";

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: Date;
  lieu_naissance: string | undefined;
  sexe: "H" | "F";
  rue: string | undefined;
  numero: string | undefined;
  npa: string | undefined;
  localite: string | undefined;
  adresse_facturation: string | undefined;
  telephone: string;
  email: string;
  type_permis: "E" | "S" | "B" | "P";
  date_permis: Date | undefined;
  niveau: "A1" | "A2" | "B1" | "B2" | "C1";
  langue_maternelle: string | undefined;
  autres_langues: string | undefined;
  src_decouverte: string | undefined;
  commentaires: string | undefined;
  pays__nom: string | undefined;
}

interface Inscription {
  id: number;
  date_inscription: Date;
  but: string;
  statut: string;
  date_sortie: Date;
  motif_sortie: string;
  preinscription: boolean;
}

interface CoursPrive {
  id: number;
  date_cours_prive: Date;
  heure_debut: string;
  heure_fin: string;
  tarif: number;
  lieu: "E" | "D";
  enseignant__nom: string;
  enseignant__prenom: string;
}

interface Document {
  id: number;
  nom: string;
  fichier_url: string;
  date_ajout: Date;
}

interface Garant {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  localite: string;
  rue: string;
  numero: string;
  npa: string;
}

interface Test {
  id: number;
  date_test: Date;
  niveau: string;
  note: number;
}

interface Paiement {
  id: number;
  date_paiement: Date;
  montant: number;
  mode_paiement: string;
  methode_paiement: string;
}

interface Facture {
  id: number;
  numero_facture: number;
  date_emission: Date;
  montant_total: number;
  montant_restant: number;
}

const ModePaiementChoices = {
  PER: "Personnel",
  BPA: "Bon de formation",
  CAF: "Chèque de formation",
  HOS: "Hospices général",
  AUT: "Autre",
} as const;

const MethodePaiementChoices = {
  ESP: "Espèce",
  CAR: "Carte bancaire",
  VIR: "Virement",
  TWI: "Twint",
  TEL: "Téléphone",
  PAY: "PayPal",
  AUT: "Autre",
} as const;

export default function ElevePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const resolvedParams = use(params);

  const [eleve, setEleve] = useState<Eleve | undefined>(undefined);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [nombre_total_paiements, setNombrePaiementsTotal] = useState(0);
  const [chargement_paiements, setChargementPaiements] = useState(false);
  const [num_page_paiements, setNumPagePaiements] = useState(1);
  const taille_page_paiements = 10;

  const [factures, setFactures] = useState<Facture[]>([]);
  const [nombre_total_factures, setNombreFacturesTotal] = useState(0);
  const [chargement_factures, setChargementFactures] = useState(false);
  const [num_page_factures, setNumPageFactures] = useState(1);
  const [filtre_factures, setFiltreFactures] = useState("tous");
  const taille_page_factures = 10;

  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [cours_prives, setCoursPrives] = useState<CoursPrive[]>([]);

  const [garant, setGarant] = useState<Garant | undefined>(undefined);

  const fetchDocuments = useCallback(async () => {
    try {
      const reponse = await api.get<Document[]>(
        `/eleves/eleves/${resolvedParams.id}/documents/`
      );

      setDocuments(reponse.data);
    } catch (err) {
      console.error("Erreur: ", err);
    }
  }, [resolvedParams.id]);

  const fetchInscriptions = useCallback(async () => {
    try {
      const reponse = await api.get<Inscription[]>(
        `/cours/${resolvedParams.id}/inscriptions/`
      );

      setInscriptions(reponse.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des inscriptions", err);
    }
  }, [resolvedParams.id]);

  const fetchTests = useCallback(async () => {
    try {
      const reponse = await api.get<Test[]>(
        `/eleves/eleves/${resolvedParams.id}/tests/`
      );

      setTests(reponse.data);
    } catch (erreur) {
      console.error("Erreur: ", erreur);
    }
  }, [resolvedParams.id]);

  const fetchCoursPrives = useCallback(async () => {
    try {
      const reponse = await api.get<CoursPrive[]>(
        `/cours/eleves/${resolvedParams.id}/cours_prives/`
      );

      setCoursPrives(reponse.data);
    } catch (err) {
      console.error("Erreur: ", err);
      setCoursPrives([]);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    async function fetchEleve() {
      try {
        const reponse = await api.get<Eleve>(
          `/eleves/eleve/${resolvedParams.id}/`
        );

        setEleve(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    async function fetchGarant() {
      try {
        const reponse = await api.get<Garant>(
          `/eleves/eleves/${resolvedParams.id}/garant/`
        );

        if (reponse.data?.id) {
          setGarant(reponse.data);
        } else {
          setGarant(undefined);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du garant", err);
      }
    }

    async function fetchPaiements() {
      setChargementPaiements(true);
      try {
        const params = {
          page: num_page_paiements,
          taille: taille_page_paiements,
        };

        const reponse = await api.get(
          `/factures/paiements/eleve/${resolvedParams.id}/`,
          { params }
        );

        setPaiements(reponse.data.paiements);
        setNombrePaiementsTotal(reponse.data.nombre_total);
      } catch (err) {
        console.error("Erreur: ", err);
        setPaiements([]);
        setNombrePaiementsTotal(0);
      }
      setChargementPaiements(false);
    }

    async function fetchFactures() {
      setChargementFactures(true);
      try {
        const params = {
          page: num_page_factures,
          taille: taille_page_factures,
        };

        let reponse;
        if (filtre_factures === "impayees") {
          reponse = await api.get(
            `/factures/factures/eleve/${resolvedParams.id}/impayees/`,
            { params }
          );
        } else if (filtre_factures === "payees") {
          reponse = await api.get(
            `/factures/factures/eleve/${resolvedParams.id}/payees/`,
            { params }
          );
        } else {
          reponse = await api.get(
            `/factures/factures/eleve/${resolvedParams.id}/`,
            { params }
          );
        }

        setFactures(reponse.data.factures);
        setNombreFacturesTotal(reponse.data.nombre_total);
      } catch (err) {
        console.error("Erreur: ", err);
        setFactures([]);
        setNombreFacturesTotal(0);
      }
      setChargementFactures(false);
    }

    fetchEleve();
    fetchGarant();
    fetchInscriptions();
    fetchDocuments();
    fetchTests();
    fetchCoursPrives();
    fetchFactures();
    fetchPaiements();
  }, [
    fetchDocuments,
    fetchInscriptions,
    fetchTests,
    fetchCoursPrives,
    resolvedParams.id,
    filtre_factures,
    num_page_factures,
    taille_page_factures,
    num_page_paiements,
    taille_page_paiements,
  ]);

  useEffect(() => {
    setNumPageFactures(1);
  }, [filtre_factures]);

  async function supprimerEleve() {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) {
      return;
    }

    try {
      await api.delete(`/eleves/eleves/${resolvedParams.id}/`);

      router.push("/ecole_peg/eleves/");
    } catch (err) {
      console.error("Erreur: ", err);

      alert("Une erreur est survenue lors de la suppression de l'élève.");
    }
  }

  async function supprimerTest(id_test: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce test ?")) {
      return;
    }

    try {
      await api.delete(`/eleves/eleves/${resolvedParams.id}/tests/${id_test}/`);

      fetchTests();
    } catch (err) {
      console.error("Erreur: ", err);

      alert("Une erreur est survenue lors de la suppression du test.");
    }
  }
  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;

    const formData = new FormData(form);

    try {
      await api.post(
        `/eleves/eleves/${resolvedParams.id}/documents/`,
        formData
      );

      form.reset();

      fetchDocuments();
    } catch (err) {
      console.error("Erreur d'upload", err);
    }
  }

  async function supprimerDocument(id_document: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      return;
    }

    try {
      await api.delete(
        `/eleves/eleves/${resolvedParams.id}/documents/${id_document}/`
      );

      fetchDocuments();
    } catch (err) {
      console.error("Erreur de suppression", err);

      alert("Une erreur est survenue lors de la suppression du document.");
    }
  }

  async function supprimerInscription(id_insription: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette inscription ?")) {
      return;
    }

    try {
      await api.delete(
        `/cours/${resolvedParams.id}/inscriptions/${id_insription}/`
      );

      fetchInscriptions();
    } catch (erreur) {
      console.error("Erreur suppression inscription:", erreur);

      alert("Une erreur est survenue lors de la suppression de l'inscription.");
    }
  }

  const formatTime = (string_temps: string) => {
    if (!string_temps) return "";

    const parsed = parseISO(`1970-01-01T${string_temps}`);

    if (!isValid(parsed)) return "";

    return format(parsed, "HH:mm");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/ecole_peg/eleves/")}
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {eleve?.nom} {eleve?.prenom}
        </h1>
      </div>

      <Tabs defaultValue="fiche" className="space-y-6">
        <TabsList className="bg-card">
          <TabsTrigger value="fiche">Fiche élève</TabsTrigger>
          <TabsTrigger value="garant">Garant</TabsTrigger>
          <TabsTrigger value="inscriptions">Inscriptions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
          <TabsTrigger value="cours_prives">Cours privés</TabsTrigger>
        </TabsList>

        <TabsContent value="fiche">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Détails et coordonnées de l&apos;élève
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {[
                { label: "Nom", value: eleve?.nom || "-" },
                { label: "Prénom", value: eleve?.prenom || "-" },
                {
                  label: "Date de naissance",
                  value: eleve?.date_naissance
                    ? formatDate(eleve.date_naissance)
                    : "-",
                },
                {
                  label: "Lieu de naissance",
                  value: eleve?.lieu_naissance || "-",
                },
                {
                  label: "Sexe",
                  value:
                    eleve?.sexe === "H"
                      ? "Homme"
                      : eleve?.sexe === "F"
                      ? "Femme"
                      : "-",
                },
                { label: "Rue", value: eleve?.rue || "-" },
                { label: "Numéro", value: eleve?.numero || "-" },
                { label: "NPA", value: eleve?.npa || "-" },
                { label: "Localité", value: eleve?.localite || "-" },
                { label: "Pays", value: eleve?.pays__nom || "-" },
                {
                  label: "Adresse de facturation",
                  value: eleve?.adresse_facturation || "-",
                },
                { label: "Téléphone", value: eleve?.telephone || "-" },
                { label: "Email", value: eleve?.email || "-" },
                {
                  label: "Type de permis",
                  value:
                    eleve?.type_permis === "E"
                      ? "Étudiant"
                      : eleve?.type_permis === "P"
                      ? "Pas de permis"
                      : eleve?.type_permis === "S"
                      ? "Permis S"
                      : eleve?.type_permis === "B"
                      ? "Permis B"
                      : "-",
                },
                {
                  label: "Date d'expiration permis",
                  value: eleve?.date_permis
                    ? formatDate(eleve.date_permis)
                    : "-",
                },
                { label: "Niveau", value: eleve?.niveau || "-" },
                {
                  label: "Langue maternelle",
                  value: eleve?.langue_maternelle || "-",
                },
                {
                  label: "Autres langues",
                  value: eleve?.autres_langues || "-",
                },
                {
                  label: "Source de découverte",
                  value: eleve?.src_decouverte || "-",
                },
                { label: "Commentaires", value: eleve?.commentaires || "-" },
              ].map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-sm">{item.value || "-"}</p>
                </div>
              ))}
              <div className="col-span-full mt-4">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() =>
                    router.push(
                      `/ecole_peg/eleves/eleve/${resolvedParams.id}/inscrire/`
                    )
                  }
                  disabled={!resolvedParams.id}
                >
                  Inscrire
                </Button>
              </div>
            </CardContent>

            <CardFooter className="justify-between border-t px-6 py-4 bg-muted/50">
              <Button
                variant="outline"
                onClick={() => {
                  router.push(
                    `/ecole_peg/eleves/eleve/${resolvedParams.id}/modifier/`
                  );
                }}
                disabled={!resolvedParams.id}
              >
                Modifier
              </Button>
              <Button
                variant="destructive"
                onClick={() => supprimerEleve()}
                disabled={!resolvedParams?.id}
              >
                Supprimer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="inscriptions">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Inscriptions</CardTitle>
              <CardDescription>
                Historique des inscriptions de l&apos;élève
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {inscriptions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>But</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date de sortie</TableHead>
                      <TableHead>Motif de sortie</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inscriptions.map((inscription) => (
                      <TableRow
                        key={inscription.id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell>
                          {formatDate(inscription.date_inscription)}
                        </TableCell>
                        <TableCell>{inscription.but || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              inscription.statut === "A"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {inscription.statut === "A" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {inscription.date_sortie
                            ? formatDate(inscription.date_sortie)
                            : "-"}
                        </TableCell>
                        <TableCell>{inscription.motif_sortie || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              inscription.preinscription
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {inscription.preinscription
                              ? "Préinscription"
                              : "Inscription"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              router.push(
                                `/ecole_peg/eleves/eleve/${resolvedParams.id}/inscrire/${inscription?.id}/modifier/`
                              );
                            }}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              supprimerInscription(inscription.id);
                            }}
                          >
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  Aucune inscription trouvée.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factures">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Factures</CardTitle>
              <CardDescription>
                Liste des factures de l&apos;élève
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="flex items-center justify-between p-6">
                <Select
                  value={filtre_factures}
                  onValueChange={(value) => setFiltreFactures(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    <SelectItem value="payees">Payées</SelectItem>
                    <SelectItem value="impayees">Impayées</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() =>
                    router.push(
                      `/ecole_peg/eleves/eleve/${resolvedParams.id}/facture/`
                    )
                  }
                >
                  Nouvelle facture
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">Numéro</TableHead>
                      <TableHead className="font-medium">Date</TableHead>
                      <TableHead className="font-medium">Montant</TableHead>
                      <TableHead className="font-medium">Statut</TableHead>
                      <TableHead className="text-right font-medium">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.length > 0 ? (
                      factures.map((facture) => (
                        <TableRow key={facture.id}>
                          <TableCell>{facture.id}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(facture.date_emission)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {facture.montant_total.toLocaleString("fr-CH")}{" "}
                              CHF
                            </span>
                            {facture.montant_restant > 0 && (
                              <div className="text-sm text-muted-foreground">
                                Restant:{" "}
                                {facture.montant_restant.toLocaleString(
                                  "fr-CH"
                                )}{" "}
                                CHF
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {facture.montant_restant === 0 ? (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700">
                                Payée
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700">
                                Impayée
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                router.push(
                                  `/ecole_peg/factures/facture/${facture.id}`
                                );
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-muted-foreground"
                        >
                          {chargement_factures
                            ? "Chargement..."
                            : "Aucune facture trouvée."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end space-x-4 p-6">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNumPageFactures((p) => Math.max(1, p - 1))
                    }
                    disabled={num_page_factures === 1}
                  >
                    Précédent
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {num_page_factures} sur{" "}
                    {Math.ceil(nombre_total_factures / taille_page_factures) ||
                      1}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNumPageFactures((p) =>
                        Math.min(
                          Math.ceil(
                            nombre_total_factures / taille_page_factures
                          ),
                          p + 1
                        )
                      )
                    }
                    disabled={
                      num_page_factures ===
                        Math.ceil(
                          nombre_total_factures / taille_page_factures
                        ) || nombre_total_factures === 0
                    }
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paiements">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>
                Suivi des paiements effectués par l&apos;élève
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">Date</TableHead>
                      <TableHead className="font-medium">Mode</TableHead>
                      <TableHead className="font-medium">Méthode</TableHead>
                      <TableHead className="font-medium">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paiements.length > 0 ? (
                      paiements.map((paiement) => (
                        <TableRow key={paiement.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(paiement.date_paiement)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {
                                ModePaiementChoices[
                                  paiement.mode_paiement as keyof typeof ModePaiementChoices
                                ]
                              }
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {paiement.methode_paiement
                                ? MethodePaiementChoices[
                                    paiement.methode_paiement as keyof typeof MethodePaiementChoices
                                  ]
                                : "-"}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {paiement.montant.toLocaleString("fr-CH")} CHF
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-6 text-muted-foreground"
                        >
                          {chargement_paiements
                            ? "Chargement..."
                            : "Aucun paiement trouvé."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end space-x-4 p-6">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNumPagePaiements((p) => Math.max(1, p - 1))
                    }
                    disabled={num_page_paiements === 1}
                  >
                    Précédent
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {num_page_paiements} sur{" "}
                    {Math.ceil(
                      nombre_total_paiements / taille_page_paiements
                    ) || 1}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNumPagePaiements((p) =>
                        Math.min(
                          Math.ceil(
                            nombre_total_paiements / taille_page_paiements
                          ),
                          p + 1
                        )
                      )
                    }
                    disabled={
                      num_page_paiements ===
                        Math.ceil(
                          nombre_total_paiements / taille_page_paiements
                        ) || nombre_total_paiements === 0
                    }
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="garant">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Informations garant</CardTitle>
              <CardDescription>
                Coordonnées de la personne garante
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {garant ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Nom", value: garant.nom },
                    { label: "Prénom", value: garant.prenom },
                    { label: "Téléphone", value: garant.telephone },
                    { label: "Email", value: garant.email },
                    {
                      label: "Adresse complète",
                      value:
                        [garant.rue, garant.numero, garant.npa, garant.localite]
                          .filter(Boolean)
                          .join(" ") || "-",
                    },
                  ].map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <p className="text-sm font-medium text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm">{item.value || "-"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    Aucun garant n&apos;est associé à cet élève.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      router.push(
                        `/ecole_peg/eleves/eleve/${resolvedParams.id}/garant/`
                      );
                    }}
                  >
                    Ajouter garant
                  </Button>
                </div>
              )}
            </CardContent>
            {garant && (
              <CardFooter className="justify-end border-t px-6 py-4 bg-muted/50">
                <Button variant="outline" asChild>
                  <Link
                    href={`/ecole_peg/eleves/eleve/${resolvedParams.id}/modifier/garant/`}
                  >
                    Modifier le garant
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Documents administratifs de l&apos;élève
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="rounded-lg border divide-y">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <a
                          href={doc.fichier_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {doc.nom}
                        </a>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(doc.date_ajout)}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => supprimerDocument(doc.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Aucun document trouvé.
                  </div>
                )}
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom du document</Label>
                    <Input
                      type="text"
                      name="nom"
                      id="nom"
                      placeholder="Nom du document"
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fichier">Fichier</Label>
                    <Input
                      type="file"
                      name="fichier"
                      id="fichier"
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  Ajouter un document
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Historique des tests</CardTitle>
              <CardDescription>
                Résultats des tests de l&apos;élève
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.length > 0 ? (
                    tests.map((test) => (
                      <TableRow key={test.id} className="hover:bg-muted/50">
                        <TableCell>{formatDate(test.date_test)}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {test.niveau}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              test.note >= 4
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {test.note}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => supprimerTest(test.id)}
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
                        className="text-center text-muted-foreground h-24"
                      >
                        Aucun test trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-end border-t px-6 py-4 bg-muted/50">
              <Button
                onClick={() => {
                  router.push(
                    `/ecole_peg/eleves/eleve/${resolvedParams.id}/test/`
                  );
                }}
              >
                Nouveau test
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>        <TabsContent value="cours_prives">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Cours privés</CardTitle>
              <CardDescription>
                Historique des cours privés de l&apos;élève
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">Date</TableHead>
                      <TableHead className="font-medium">Horaire</TableHead>
                      <TableHead className="font-medium">Enseignant</TableHead>
                      <TableHead className="font-medium">Lieu</TableHead>
                      <TableHead className="font-medium">Tarif</TableHead>
                      <TableHead className="text-right font-medium">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cours_prives.length > 0 ? (
                      cours_prives.map((cours) => (
                        <TableRow key={cours.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(cours.date_cours_prive)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatTime(cours.heure_debut)} –{" "}
                            {formatTime(cours.heure_fin)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {cours.enseignant__nom} {cours.enseignant__prenom}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-700">
                              {cours.lieu === "E"
                                ? "École"
                                : cours.lieu === "D"
                                ? "Domicile"
                                : cours.lieu}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">
                            {typeof cours.tarif === "number"
                              ? cours.tarif.toLocaleString("fr-CH")
                              : cours.tarif}{" "}
                            CHF
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                router.push(
                                  `/ecole_peg/cours_prives/cours_prive/${cours.id}`,
                                );
                              }}
                            >
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Aucun cours privé trouvé.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
