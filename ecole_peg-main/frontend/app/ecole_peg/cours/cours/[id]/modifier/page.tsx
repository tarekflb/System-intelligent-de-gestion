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
import { ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/radio-group";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";

interface Cours {
  nom: string;
  type_cours: "I" | "S";
  niveau: "A1" | "A2" | "B1" | "B2" | "C1";
  heures_par_semaine: number;
  duree_semaines: number;
  tarif: number;
}

export default function ModifierCoursPage({
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
  } = useForm<Cours>();

  const [type_cours, setTypeCours] = useState<"I" | "S">("I");
  const [niveau, setNiveau] = useState<"A1" | "A2" | "B1" | "B2" | "C1">("A1");

  useEffect(() => {
    async function fetchCours() {
      try {
        const reponse = await api.get<Cours>(
          `/cours/cours/${resolvedParams.id}/`,
        );

        const cours = reponse.data;

        setTypeCours(cours.type_cours);

        setNiveau(cours.niveau);

        reset({
          nom: cours.nom,
          heures_par_semaine: cours.heures_par_semaine,
          duree_semaines: cours.duree_semaines,
          tarif: cours.tarif,
        });
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    fetchCours();
  }, [reset, resolvedParams.id]);

  const onSoumission = useCallback(
    async (donnees: Cours) => {
      const payload = {
        ...donnees,
        type_cours,
        niveau,
      };

      try {
        await api.put(`/cours/cours/${resolvedParams.id}/`, payload);

        router.push(`/ecole_peg/cours/`);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    },
    [niveau, resolvedParams.id, router, type_cours],
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push(`/ecole_peg/cours/cours/${resolvedParams.id}/`)
          }
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Modifier le cours
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSoumission)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Détails du cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-base">
                Nom du cours
              </Label>
              <Input
                id="nom"
                placeholder="ex: Français débutant"
                className="font-medium"
                {...register("nom", { required: "Nom est obligatoire" })}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base">Type de cours</Label>
              <RadioGroup
                value={type_cours}
                onValueChange={(value) => setTypeCours(value as "I" | "S")}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  {
                    value: "I",
                    label: "Intensif",
                    desc: "Progression rapide, rythme soutenu",
                  },
                  {
                    value: "S",
                    label: "Semi-intensif",
                    desc: "Progression modérée, plus flexible",
                  },
                ].map(({ value, label, desc }) => (
                  <div
                    key={value}
                    className={`flex flex-col space-y-1 rounded-lg border p-4 cursor-pointer transition-colors ${
                      type_cours === value ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={value}
                        id={`type-${value.toLowerCase()}`}
                      />
                      <Label
                        htmlFor={`type-${value.toLowerCase()}`}
                        className="font-medium"
                      >
                        {label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{desc}</p>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-base">Niveau</Label>
              <RadioGroup
                value={niveau}
                onValueChange={(value) =>
                  setNiveau(value as "A1" | "A2" | "B1" | "B2" | "C1")
                }
                className="grid grid-cols-5 gap-2"
              >
                {["A1", "A2", "B1", "B2", "C1"].map((n) => (
                  <div
                    key={n}
                    className={`relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      niveau === n ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <RadioGroupItem
                      value={n}
                      id={`niveau-${n}`}
                      className="absolute inset-0 opacity-0"
                    />
                    <Label
                      htmlFor={`niveau-${n}`}
                      className="font-medium cursor-pointer"
                    >
                      {n}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duree_semaines" className="text-base">
                  Durée (semaines)
                </Label>
                <Input
                  id="duree_semaines"
                  type="number"
                  min={1}
                  max={52}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="font-mono"
                  {...register("duree_semaines", {
                    valueAsNumber: true,
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Entre 1 et 52 semaines
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heures_par_semaine" className="text-base">
                  Heures par semaine
                </Label>
                <Input
                  id="heures_par_semaine"
                  type="number"
                  min={1}
                  max={40}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="font-mono"
                  {...register("heures_par_semaine", {
                    valueAsNumber: true,
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Entre 1 et 40 heures
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarif" className="text-base">
                Tarif (CHF)
              </Label>
              <div className="relative">
                <Input
                  id="tarif"
                  type="number"
                  min={0}
                  step="0.01"
                  onWheel={(e) => e.currentTarget.blur()}
                  className="pl-8 font-mono"
                  placeholder="0.00"
                  {...register("tarif", {
                    required: "Tarif est obligatoire",
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {isSubmitting
                ? "Enregistrement..."
                : "Enregistrer les modifications"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
