"use client";

import { useCallback, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { ArrowLeft, Save, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/textarea";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
}

interface Inscription {
  id: number;
  date_inscription: Date;
  statut: "A" | "I";
  preinscription: boolean;
  frais_inscription: number;
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

interface DetailFacture {
  description: string;
  date_debut_periode: Date | undefined;
  date_fin_periode: Date | undefined;
  montant: number;
}

export default function NouvelleFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const router = useRouter();
  const resolvedParams = use(params);

  const [total, setTotal] = useState<string>("0.00");
  const [details_facture, setDetailsFacture] = useState<DetailFacture[]>([]);

  const [eleve, setEleve] = useState<Eleve | undefined>(undefined);

  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [cours_prives, setCoursPrives] = useState<CoursPrive[]>([]);

  const [type_facture, setTypeFacture] = useState<
    "inscription" | "cours_prive"
  >("inscription");

  const [id_reference, setIdReference] = useState<number>();

  const ajouterDetail = () => {
    setDetailsFacture([
      ...details_facture,
      {
        description: "",
        date_debut_periode: undefined,
        date_fin_periode: undefined,
        montant: 0,
      },
    ]);
  };

  const supprimerDetail = (indice: number) => {
    const nouveaux_details = [...details_facture];

    nouveaux_details.splice(indice, 1);

    setDetailsFacture(nouveaux_details);
    calculerTotal(nouveaux_details);
  };

  const modifierDetail = (
    indice: number,
    champ: keyof DetailFacture,
    valeur: unknown,
  ) => {
    const nouveaux_details = [...details_facture];

    nouveaux_details[indice] = {
      ...nouveaux_details[indice],
      [champ]: valeur,
    };

    setDetailsFacture(nouveaux_details);

    if (champ === "montant") calculerTotal(nouveaux_details);
  };

  const calculerTotal = (details: DetailFacture[]) => {
    const total = details.reduce((sum, detail) => {
      return sum + (detail.montant || 0);
    }, 0);

    setTotal(total.toFixed(2));
  };

  const onSoumission = useCallback(async () => {
    const donnees_completes: {
      details_facture: {
        description: string;
        date_debut_periode: string | undefined;
        date_fin_periode: string | undefined;
        montant: number;
      }[];
      id_inscription?: number;
      id_cours_prive?: number;
      id_eleve?: number;
    } = {
      details_facture: details_facture.map((detail) => ({
        description: detail.description,
        date_debut_periode: detail.date_debut_periode
          ? format(detail.date_debut_periode, "yyyy-MM-dd")
          : undefined,
        date_fin_periode: detail.date_fin_periode
          ? format(detail.date_fin_periode, "yyyy-MM-dd")
          : undefined,
        montant: detail.montant,
      })),
    };

    if (type_facture === "inscription") {
      donnees_completes.id_inscription = id_reference;
    } else if (type_facture === "cours_prive") {
      donnees_completes.id_cours_prive = id_reference;
      donnees_completes.id_eleve = Number(resolvedParams.id);
    }

    try {
      await api.post(`/factures/facture/`, donnees_completes);

      router.push(`/ecole_peg/eleves/eleve/${resolvedParams.id}/`);
    } catch (err) {
      console.error("Erreur: ", err);
    }
  }, [details_facture, type_facture, id_reference, resolvedParams.id, router]);

  useEffect(() => {
    async function fetchEleve() {
      try {
        const reponse = await api.get<Eleve>(
          `/eleves/eleve/${resolvedParams.id}/`,
        );

        setEleve(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    async function fetchInscriptions() {
      try {
        const reponse = await api.get<Inscription[]>(
          `/cours/${resolvedParams.id}/inscriptions/`,
        );

        setInscriptions(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    async function fetchCoursPrives() {
      try {
        const reponse = await api.get(
          `/cours/eleves/${resolvedParams.id}/cours_prives/`,
        );

        setCoursPrives(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    fetchEleve();
    fetchInscriptions();
    fetchCoursPrives();
  }, [resolvedParams.id]);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push(`/ecole_peg/eleves/eleve/${resolvedParams.id}/`)
          }
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Nouvelle facture pour {eleve?.nom} {eleve?.prenom}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSoumission)} className="space-y-6">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Détails de la facture</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type de facturation</Label>
                <Select
                  defaultValue={type_facture}
                  onValueChange={(value) => {
                    setTypeFacture(value as "inscription" | "cours_prive");

                    setIdReference(undefined);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inscription">
                      Inscription au cours
                    </SelectItem>
                    <SelectItem value="cours_prive">Cours privé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {type_facture === "inscription" ? (
                  <>
                    <Label>Inscription</Label>
                    <Select
                      required
                      onValueChange={(value) => setIdReference(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner l'inscription" />
                      </SelectTrigger>
                      <SelectContent>
                        {inscriptions
                          .filter((i) => !i.preinscription)
                          .map((i) => (
                            <SelectItem key={i.id} value={i.id.toString()}>
                              {formatDate(i.date_inscription)} (
                              {i.statut === "A" ? "Active" : "Inactive"}) (
                              {i.frais_inscription} CHF)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Label>Cours Privé</Label>
                    <Select
                      required
                      onValueChange={(value) => setIdReference(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un cours privé" />
                      </SelectTrigger>
                      <SelectContent>
                        {cours_prives.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {formatDate(c.date_cours_prive)} (
                            {c.enseignant__prenom} {c.enseignant__nom} -{" "}
                            {c.tarif} CHF)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl">Lignes de facturation</CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={ajouterDetail}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {details_facture.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aucune ligne de facturation. Cliquez sur &quot;Ajouter une
                    ligne&quot; pour commencer.
                  </p>
                </div>
              ) : (
                details_facture.map((detail, indice) => (
                  <div
                    key={indice}
                    className="relative space-y-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
                  >
                    {details_facture.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 opacity-70 hover:opacity-100"
                        onClick={() => supprimerDetail(indice)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={detail.description}
                        onChange={(e) =>
                          modifierDetail(indice, "description", e.target.value)
                        }
                        placeholder="Description de la ligne de facturation"
                        className="min-h-[80px]"
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Période du</Label>
                        <Input
                          type="date"
                          className="w-full"
                          value={
                            detail.date_debut_periode instanceof Date &&
                            !isNaN(detail.date_debut_periode.getTime())
                              ? format(detail.date_debut_periode, "yyyy-MM-dd")
                              : ""
                          }
                          onChange={(e) => {
                            modifierDetail(
                              indice,
                              "date_debut_periode",
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            );
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>au</Label>
                        <Input
                          type="date"
                          className="w-full"
                          value={
                            detail.date_fin_periode instanceof Date &&
                            !isNaN(detail.date_fin_periode.getTime())
                              ? format(detail.date_fin_periode, "yyyy-MM-dd")
                              : ""
                          }
                          onChange={(e) => {
                            modifierDetail(
                              indice,
                              "date_fin_periode",
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Montant (CHF)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={detail.montant.toString()}
                        onChange={(e) => {
                          const valeur = parseFloat(e.target.value);
                          modifierDetail(
                            indice,
                            "montant",
                            isNaN(valeur) ? 0 : valeur,
                          );
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0.00"
                        className="font-mono"
                        required
                      />
                    </div>
                  </div>
                ))
              )}

              {details_facture.length > 0 && (
                <div className="mt-6 flex justify-end rounded-lg border bg-card p-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {total} CHF
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              className="min-w-[150px]"
              disabled={isSubmitting || details_facture.length === 0}
            >
              {isSubmitting ? (
                <>Sauvegarde en cours...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
