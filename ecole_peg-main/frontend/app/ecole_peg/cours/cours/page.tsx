"use client";

import { useCallback, useState } from "react";
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
import { useForm } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/radio-group";
import { api } from "@/lib/api";

export default function NouveauCoursPage() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const router = useRouter();

  const [type_cours, setTypeCours] = useState<"I" | "S">("I");
  const [niveau, setNiveau] = useState<"A1" | "A2" | "B1" | "B2" | "C1">("A1");

  const onSoumission = useCallback(
    async (donnees: object) => {
      const donnees_completes = {
        ...donnees,
        type_cours,
        niveau,
      };

      console.log(donnees_completes);

      try {
        await api.post("/cours/cour/", donnees_completes);

        router.push("/ecole_peg/cours/");
      } catch (err) {
        console.error("Erreur: ", err);
      }
    },
    [niveau, router, type_cours],
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/ecole_peg/cours/")}
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau Cours</h1>
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
                required
                className="font-medium"
                {...register("nom", {
                  required: "Le nom du cours est obligatoire",
                  pattern: {
                    value: /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/,
                    message:
                      "Le nom ne doit contenir que des lettres, espaces, apostrophes ou tirets.",
                  },
                  setValueAs: (v) => v.trim(),
                })}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base">Type de cours</Label>
              <RadioGroup
                defaultValue={type_cours}
                className="grid grid-cols-2 gap-4"
                onValueChange={(valeur) => setTypeCours(valeur as "I" | "S")}
                required
                id="type"
              >
                <div className="flex flex-col space-y-1 rounded-lg border p-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="I" id="type-i" />
                    <Label htmlFor="type-i" className="font-medium">
                      Intensif
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    Cours à rythme soutenu, progression rapide
                  </p>
                </div>
                <div className="flex flex-col space-y-1 rounded-lg border p-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="S" id="type-s" />
                    <Label htmlFor="type-s" className="font-medium">
                      Semi-intensif
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    Cours à rythme modéré, plus flexible
                  </p>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="niveau" className="text-base">
                Niveau
              </Label>
              <Select
                name="niveau"
                required
                onValueChange={(valeur) =>
                  setNiveau(valeur as "A1" | "A2" | "B1" | "B2" | "C1")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">A1 - Débutant</SelectItem>
                  <SelectItem value="A2">A2 - Élémentaire</SelectItem>
                  <SelectItem value="B1">B1 - Intermédiaire</SelectItem>
                  <SelectItem value="B2">B2 - Intermédiaire avancé</SelectItem>
                  <SelectItem value="C1">C1 - Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duree_semaines" className="text-base">
                  Durée (semaines)
                </Label>
                <Input
                  id="duree_semaines"
                  type="number"
                  min="1"
                  max="52"
                  onWheel={(e) => e.currentTarget.blur()}
                  className="font-mono"
                  required
                  {...register("duree_semaines", {
                    required: "La durée est obligatoire",
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "La durée minimum est d'une semaine",
                    },
                    max: {
                      value: 52,
                      message: "La durée maximum est de 52 semaines",
                    },
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heures_par_semaine" className="text-base">
                  Heures par semaine
                </Label>
                <Input
                  id="heures_par_semaine"
                  type="number"
                  min="1"
                  max="40"
                  className="font-mono"
                  onWheel={(e) => e.currentTarget.blur()}
                  required
                  {...register("heures_par_semaine", {
                    required: "Le nombre d'heures est obligatoire",
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "Minimum 1 heure par semaine",
                    },
                    max: {
                      value: 40,
                      message: "Maximum 40 heures par semaine",
                    },
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarif" className="text-base">
                Tarif (CHF)
              </Label>
              <Input
                id="tarif"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="font-mono"
                onWheel={(e) => e.currentTarget.blur()}
                required
                {...register("tarif", {
                  required: "Le tarif est obligatoire",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Le tarif ne peut pas être négatif",
                  },
                })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Enregistrement...
                </>
              ) : (
                "Enregistrer le cours"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
