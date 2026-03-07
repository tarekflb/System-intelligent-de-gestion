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
import { ArrowLeft, Save } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
}

export default function NouveauTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const router = useRouter();
  const resolvedParams = use(params);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [niveau, setNiveau] = useState<"A1" | "A2" | "B1" | "B2" | "C1">("A1");
  const [eleve, setEleve] = useState<Eleve | undefined>(undefined);

  const onSoumission = useCallback(
    async (donnees: object) => {
      const donnees_completes = {
        ...donnees,
        date_test: date ? format(date, "yyyy-MM-dd") : undefined,
        niveau,
      };

      try {
        await api.post(
          `/eleves/eleves/${resolvedParams.id}/tests/`,
          donnees_completes,
        );

        router.push(`/ecole_peg/eleves/eleve/${resolvedParams.id}/`);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    },
    [date, niveau, resolvedParams, router],
  );

  useEffect(() => {
    async function fetchEleve() {
      try {
        const reponse = await api.get<Eleve>(
          `/eleves/eleve/${resolvedParams.id}/`,
        );

        setEleve(reponse.data);
      } catch (err) {
        console.error("Erreur fetchEleve:", err);
      }
    }

    fetchEleve();
  }, [resolvedParams.id]);

  return (
    <div className="container mx-auto py-6 max-w-2xl">
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
          Nouveau test de niveau pour {eleve?.nom} {eleve?.prenom}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSoumission)} className="space-y-6">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Détails du test</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="space-y-2">
              <Label>Date du test</Label>
              <Input
                type="date"
                value={
                  date instanceof Date && !isNaN(date.getTime())
                    ? format(date, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => {
                  setDate(new Date(e.target.value));
                }}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="niveau">Niveau évalué</Label>
              <Select
                value={niveau}
                onValueChange={(value) =>
                  setNiveau(value as "A1" | "A2" | "B1" | "B2" | "C1")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">
                    <div className="font-medium">A1</div>
                    <div className="text-xs text-muted-foreground">
                      Niveau débutant
                    </div>
                  </SelectItem>
                  <SelectItem value="A2">
                    <div className="font-medium">A2</div>
                    <div className="text-xs text-muted-foreground">
                      Niveau élémentaire
                    </div>
                  </SelectItem>
                  <SelectItem value="B1">
                    <div className="font-medium">B1</div>
                    <div className="text-xs text-muted-foreground">
                      Niveau intermédiaire
                    </div>
                  </SelectItem>
                  <SelectItem value="B2">
                    <div className="font-medium">B2</div>
                    <div className="text-xs text-muted-foreground">
                      Niveau intermédiaire supérieur
                    </div>
                  </SelectItem>
                  <SelectItem value="C1">
                    <div className="font-medium">C1</div>
                    <div className="text-xs text-muted-foreground">
                      Niveau avancé
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note obtenue</Label>
              <Input
                id="note"
                type="number"
                min="0"
                max="20"
                step="0.25"
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Ex: 18.5"
                className="font-mono"
                {...register("note", {
                  required: "La note du test est obligatoire",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "La note ne peut pas être négative",
                  },
                  max: {
                    value: 20,
                    message: "La note ne peut pas dépasser 20",
                  },
                })}
              />
              <p className="text-sm text-muted-foreground">
                Entrez une note entre 0 et 20 points
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              className="min-w-[150px]"
              disabled={isSubmitting || !date}
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
