"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/button";
import { Card, CardContent } from "@/components/card";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { useForm } from "react-hook-form";

const months = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

export default function NouvelleFichePresencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { register, handleSubmit, watch } = useForm<{ annee: number }>({
    defaultValues: {
      annee: new Date().getFullYear(),
    },
  });

  const [mois, setMois] = useState<
    | "01"
    | "02"
    | "03"
    | "04"
    | "05"
    | "06"
    | "07"
    | "08"
    | "09"
    | "10"
    | "11"
    | "12"
  >("01");

  const annee = watch("annee");

  const onSoumission = useCallback(
    async (donnees: object) => {
      const donnees_completes = {
        ...donnees,
        mois,
      };

      try {
        await api.post(
          `/cours/session/${resolvedParams.id}/fiche_presences/`,
          donnees_completes,
        );

        router.push(`/ecole_peg/sessions/session/${resolvedParams.id}/`);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    },
    [mois, resolvedParams.id, router],
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Card className="shadow-lg">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Nouvelle fiche de présence
            </h1>
            <p className="text-sm text-muted-foreground">
              Sélectionnez le mois et l&apos;année pour créer une nouvelle fiche
              de présence
            </p>
          </div>

          <form onSubmit={handleSubmit(onSoumission)} className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="relative rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                    <Label htmlFor="mois" className="text-base">
                      Mois
                    </Label>
                    <Select
                      value={mois}
                      onValueChange={(value) => {
                        setMois(
                          value as
                            | "01"
                            | "02"
                            | "03"
                            | "04"
                            | "05"
                            | "06"
                            | "07"
                            | "08"
                            | "09"
                            | "10"
                            | "11"
                            | "12",
                        );
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionner un mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            className={
                              new Date().getMonth() + 1 === parseInt(m.value)
                                ? "font-medium text-primary"
                                : ""
                            }
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="relative rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                  <Label htmlFor="annee" className="text-base">
                    Année
                  </Label>
                  <Input
                    id="annee"
                    type="number"
                    min={2020}
                    max={2050}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="mt-2 font-mono"
                    placeholder="YYYY"
                    {...register("annee", {
                      required: "Année est obligatoire",
                      valueAsNumber: true,
                    })}
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Année entre 2020 et 2050
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-primary/5 p-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <svg
                      className="h-4 w-4 text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {mois
                        ? `${
                            months.find((m) => m.value === mois)?.label
                          } ${annee}`
                        : "Sélectionnez un mois et une année"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      La fiche de présence sera créée pour la session
                      sélectionnée
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!mois || !annee}
                className="w-full sm:w-auto"
              >
                {!mois || !annee
                  ? "Complétez les champs"
                  : "Créer la fiche de présence"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
