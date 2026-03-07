"use client";

import { useCallback } from "react";
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
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";

export default function NouveauEnseignantPage() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const router = useRouter();

  const onSoumission = useCallback(
    async (donnees: object) => {
      try {
        await api.post("/cours/enseignant/", donnees);

        router.push("/ecole_peg/enseignants/");
      } catch (err) {
        console.error("Erreur: ", err);
      }
    },
    [router],
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/ecole_peg/enseignants/")}
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Nouveau Enseignant
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSoumission)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Détails de l&apos;enseignant</CardTitle>
            <p className="text-sm text-muted-foreground">
              Entrez les informations personnelles de l&apos;enseignant
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-base">
                  Nom
                </Label>
                <Input
                  id="nom"
                  placeholder="ex: Dubois"
                  className="w-full font-medium"
                  required
                  {...register("nom", {
                    required: "Le nom est obligatoire",
                    pattern: {
                      value: /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/,
                      message:
                        "Le nom ne doit contenir que des lettres, espaces, apostrophes ou tirets.",
                    },
                    setValueAs: (v) => v.trim(),
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prenom" className="text-base">
                  Prénom
                </Label>
                <Input
                  id="prenom"
                  placeholder="ex: Marie"
                  className="w-full font-medium"
                  required
                  {...register("prenom", {
                    required: "Le prénom est obligatoire",
                    pattern: {
                      value: /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/,
                      message:
                        "Le prénom ne doit contenir que des lettres, espaces, apostrophes ou tirets.",
                    },
                    setValueAs: (v) => v.trim(),
                  })}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
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
                "Enregistrer l'enseignant"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
