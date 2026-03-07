"use client";

import { use, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
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
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
}

interface Garant {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  rue: string;
  numero: string;
  npa: string;
  localite: string;
}

export default function ModifierGarantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Garant>();

  const router = useRouter();
  const resolvedParams = use(params);

  const [eleve, setEleve] = useState<Eleve | undefined>(undefined);

  useEffect(() => {
    async function fetchDonnees() {
      try {
        const [reponse_eleve, reponse_garant] = await Promise.all([
          api.get<Eleve>(`/eleves/eleve/${resolvedParams.id}/`),
          api.get<Garant>(`/eleves/eleves/${resolvedParams.id}/garant/`),
        ]);

        setEleve(reponse_eleve.data);

        const garant = reponse_garant.data;

        reset({
          nom: garant.nom,
          prenom: garant.prenom,
          telephone: garant.telephone,
          email: garant.email,
          rue: garant.rue,
          numero: garant.numero,
          npa: garant.npa,
          localite: garant.localite,
        });
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    fetchDonnees();
  }, [reset, resolvedParams.id]);

  const onSoumission = useCallback(
    async (donnees: Garant) => {
      try {
        await api.put(`/eleves/eleves/${resolvedParams.id}/garant/`, donnees);

        router.push(`/ecole_peg/eleves/eleve/${resolvedParams.id}/`);
      } catch (err) {
        console.error("Erreur lors de la modification du garant :", err);
      }
    },
    [resolvedParams.id, router],
  );

  if (!eleve) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
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
          Modifier le garant de {eleve.nom} {eleve.prenom}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSoumission)} className="space-y-6">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Informations du garant</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  placeholder="Nom du garant"
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
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  placeholder="Prénom du garant"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  placeholder="+41 XX XXX XX XX"
                  {...register("telephone", {
                    required: "Le numéro de téléphone est obligatoire",
                    pattern: {
                      value: /^\+?\d{7,15}$/,
                      message:
                        "Le numéro de téléphone doit être au format suisse.",
                    },
                    setValueAs: (v) => v.trim(),
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemple.ch"
                  {...register("email", {
                    required: "L'email est obligatoire",
                    setValueAs: (v) => v.trim(),
                  })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rue">Rue</Label>
                <Input
                  id="rue"
                  placeholder="Nom de la rue"
                  {...register("rue")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Numéro</Label>
                <Input id="numero" placeholder="N°" {...register("numero")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="npa">NPA</Label>
                <Input
                  id="npa"
                  placeholder="Code postal"
                  {...register("npa")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localite">Localité</Label>
                <Input
                  id="localite"
                  placeholder="Ville"
                  {...register("localite")}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="min-w-[150px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Sauvegarde en cours...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
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
