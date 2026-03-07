"use client";

import { use, useCallback, useEffect, useState } from "react";
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
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";

interface Cours {
  id: number;
  nom: string;
  type_cours: "I" | "S";
  niveau: "A1" | "A2" | "B1" | "B2" | "C1";
}

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
}

interface Session {
  id: number;
  cours__nom: string;
  cours__type_cours: "I" | "S";
  cours__niveau: "A1" | "A2" | "B1" | "B2" | "C1";
  date_debut: Date;
  date_fin: Date;
  periode_journee: "M" | "S" | "A";
  statut: "O" | "F";
  seances_mois: number;
  capacite_max: number;
  id_cours: number;
  id_enseignant: number;
}

export default function ModifierSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const [date_debut, setDateDebut] = useState<Date | undefined>(undefined);
  const [date_fin, setDateFin] = useState<Date | undefined>(undefined);

  const [cours, setCours] = useState<Cours[]>([]);
  const [id_cours, setIdCours] = useState<number>();

  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [id_enseignant, setIdEnseignant] = useState<number>();

  const [periode_journee, setPeriodeJournee] = useState<"M" | "S" | "A">("M");

  useEffect(() => {
    async function fetchDonnees() {
      try {
        const [reponse_cours, reponse_enseignants, reponse_session] =
          await Promise.all([
            api.get<Cours[]>("/cours/cours/"),
            api.get<Enseignant[]>("/cours/enseignants/"),
            api.get<Session>(`/cours/sessions/${resolvedParams.id}/`),
          ]);

        setCours(reponse_cours.data);

        setEnseignants(reponse_enseignants.data);

        const session: Session = reponse_session.data;

        setIdCours(session.id_cours);
        setIdEnseignant(session.id_enseignant);

        setDateDebut(new Date(session.date_debut));
        setDateFin(new Date(session.date_fin));

        setPeriodeJournee(session.periode_journee as "M" | "S" | "A");

        reset({
          seances_mois: session.seances_mois,
          capacite_max: session.capacite_max,
        });
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    fetchDonnees();
  }, [reset, resolvedParams.id]);

  const onSoumission = useCallback(
    async (donnees: object) => {
      const donnees_completes = {
        ...donnees,
        date_debut: date_debut ? format(date_debut, "yyyy-MM-dd") : undefined,
        date_fin: date_fin ? format(date_fin, "yyyy-MM-dd") : undefined,
        id_cours,
        id_enseignant,
        periode_journee,
      };

      try {
        await api.put(
          `/cours/sessions/${resolvedParams.id}/`,
          donnees_completes
        );

        router.push(`/ecole_peg/sessions/session/${resolvedParams.id}/`);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    },
    [
      date_debut,
      date_fin,
      id_cours,
      id_enseignant,
      periode_journee,
      resolvedParams.id,
      router,
    ]
  );

  if (id_cours === undefined || id_enseignant === undefined) {
    return <div>Chargement…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push(`/ecole_peg/sessions/session/${resolvedParams.id}/`)
          }
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier la Session
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSoumission)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Détails de la session</CardTitle>
            <p className="text-sm text-muted-foreground">
              Modifiez les informations de la session ci-dessous
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cours" className="text-base">
                  Cours
                </Label>
                <Select
                  defaultValue={String(id_cours)}
                  name="id_cours"
                  required
                  onValueChange={(valeur) => setIdCours(Number(valeur))}
                >
                  <SelectTrigger id="cours">
                    <SelectValue placeholder="Sélectionner un cours" />
                  </SelectTrigger>
                  <SelectContent>
                    {cours.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nom}{" "}
                        <span className="text-muted-foreground">
                          ({c.type_cours === "I" ? "intensif" : "semi-intensif"}{" "}
                          - {c.niveau})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="enseignant" className="text-base">
                  Enseignant
                </Label>
                <Select
                  defaultValue={String(id_enseignant)}
                  name="enseignant"
                  required
                  onValueChange={(valeur) => setIdEnseignant(Number(valeur))}
                >
                  <SelectTrigger id="enseignant">
                    <SelectValue placeholder="Sélectionner un enseignant" />
                  </SelectTrigger>
                  <SelectContent>
                    {enseignants.map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>
                        {e.nom} {e.prenom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_debut" className="text-base">
                  Date de début
                </Label>
                <Input
                  id="date_debut"
                  type="date"
                  min={format(new Date(), "yyyy-MM-dd")}
                  required
                  className="font-mono"
                  value={
                    date_debut instanceof Date && !isNaN(date_debut.getTime())
                      ? format(date_debut, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => setDateDebut(new Date(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_fin" className="text-base">
                  Date de fin
                </Label>
                <Input
                  id="date_fin"
                  type="date"
                  min={
                    date_debut instanceof Date && !isNaN(date_debut.getTime())
                      ? format(date_debut, "yyyy-MM-dd")
                      : undefined
                  }
                  required
                  className="font-mono"
                  value={
                    date_fin instanceof Date && !isNaN(date_fin.getTime())
                      ? format(date_fin, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => setDateFin(new Date(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="seances_mois" className="text-base">
                  Séances par mois
                </Label>
                <Input
                  id="seances_mois"
                  type="number"
                  min={1}
                  max={31}
                  className="font-mono"
                  {...register("seances_mois", {
                    required: "Séances par mois est obligatoire",
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "Minimum 1 séance par mois",
                    },
                    max: {
                      value: 31,
                      message: "Maximum 31 séances par mois",
                    },
                  })}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacite_max" className="text-base">
                  Capacité maximale
                </Label>
                <Input
                  id="capacite_max"
                  type="number"
                  min={1}
                  className="font-mono"
                  placeholder="Nombre d'élèves max."
                  {...register("capacite_max", {
                    required: "Capacité maximale est obligatoire",
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "La capacité doit être d'au moins 1",
                    },
                  })}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
            </div>

            <div className="space-y-4">
  <Label className="text-base">Période de la journée</Label>
  <div className="grid grid-cols-3 gap-4">
    {/* Matin */}
    <div
      className={`flex flex-col space-y-1 rounded-lg border p-4 cursor-pointer transition-colors ${
        periode_journee === "M" ? "border-primary bg-primary/5" : ""
      }`}
      onClick={() => setPeriodeJournee("M")}
    >
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          name="periode_journee"
          value="M"
          checked={periode_journee === "M"}
          onChange={() => setPeriodeJournee("M")}
          className="hidden"
        />
        <div
          className={`w-4 h-4 rounded-full border-2 ${
            periode_journee === "M"
              ? "border-primary bg-primary"
              : "border-muted"
          }`}
        />
        <span className="font-medium">Matin</span>
      </div>
      <p className="text-sm text-muted-foreground pl-6">
        Session programmée le matin
      </p>
    </div>

    {/* Après-midi */}
    <div
      className={`flex flex-col space-y-1 rounded-lg border p-4 cursor-pointer transition-colors ${
        periode_journee === "A" ? "border-primary bg-primary/5" : ""
      }`}
      onClick={() => setPeriodeJournee("A")}
    >
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          name="periode_journee"
          value="A"
          checked={periode_journee === "A"}
          onChange={() => setPeriodeJournee("A")}
          className="hidden"
        />
        <div
          className={`w-4 h-4 rounded-full border-2 ${
            periode_journee === "A"
              ? "border-primary bg-primary"
              : "border-muted"
          }`}
        />
        <span className="font-medium">Après-midi</span>
      </div>
      <p className="text-sm text-muted-foreground pl-6">
        Session programmée l&apos;après-midi
      </p>
    </div>

    {/* Soir */}
    <div
      className={`flex flex-col space-y-1 rounded-lg border p-4 cursor-pointer transition-colors ${
        periode_journee === "S" ? "border-primary bg-primary/5" : ""
      }`}
      onClick={() => setPeriodeJournee("S")}
    >
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          name="periode_journee"
          value="S"
          checked={periode_journee === "S"}
          onChange={() => setPeriodeJournee("S")}
          className="hidden"
        />
        <div
          className={`w-4 h-4 rounded-full border-2 ${
            periode_journee === "S"
              ? "border-primary bg-primary"
              : "border-muted"
          }`}
        />
        <span className="font-medium">Soir</span>
      </div>
      <p className="text-sm text-muted-foreground pl-6">
        Session programmée le soir
      </p>
    </div>
  </div>
</div>

          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
