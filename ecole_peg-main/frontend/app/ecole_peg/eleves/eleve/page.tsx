"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Checkbox } from "@/components/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/radio-group";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/textarea";
import { isAxiosError } from "axios";

interface Pays {
  id: number;
  nom: string;
}

export default function NouveauElevePage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm();

  const router = useRouter();

  const [sexe, setSexe] = useState<"H" | "F">("H");
  const [date_naissance, setDateNaissance] = useState<Date | undefined>(
    undefined
  );
  const [niveau, setNiveau] = useState<
    "A1" | "A2" | "B1" | "B2" | "C1" | undefined
  >(undefined);
  const [type_permis, setTypePermis] = useState<"E" | "S" | "B" | "P">("P");
  const [date_permis, setDatePermis] = useState<Date | undefined>(undefined);
  const [pays, setPays] = useState<Pays[]>([]);
  const [id_pays, setIdPays] = useState<number>();
  const [a_garant, setAGarant] = useState<boolean>(false);

  const onSoumission = useCallback(
    async (donnees: object) => {
      const now = new Date();

      if (date_naissance && date_naissance > now) {
        setError("date_naissance", {
          message: "La date de naissance ne peut être dans le futur.",
        });

        return;
      }

      const donnees_completes = {
        ...donnees,
        sexe,
        date_naissance: date_naissance
          ? format(date_naissance, "yyyy-MM-dd")
          : undefined,
        niveau,
        type_permis,
        date_permis: date_permis
          ? format(date_permis, "yyyy-MM-dd")
          : undefined,
        pays_id: id_pays,
      };

      try {
        const reponse = await api.post("/eleves/eleve/", donnees_completes);

        if (a_garant)
          router.push(`/ecole_peg/eleves/eleve/${reponse.data.id}/garant/`);
        else router.push(`/ecole_peg/eleves/eleve/${reponse.data.id}/`);
      } catch (err) {
        if (isAxiosError(err) && err.response) {
          console.error("Erreurs de validation: ", err.response.data.erreurs);

          alert("Erreur de validation: vérifie tous les champs.");
        } else {
          console.error("Erreur inconnue: ", err);
        }
      }
    },
    [
      a_garant,
      date_naissance,
      date_permis,
      id_pays,
      niveau,
      router,
      setError,
      sexe,
      type_permis,
    ]
  );

  useEffect(() => {
    async function fetchPays() {
      try {
        const reponse = await api.get<Pays[]>("/eleves/pays/");

        setPays(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    fetchPays();
  }, []);

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/ecole_peg/eleves/")}
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau Élève</h1>
      </div>

      <form onSubmit={handleSubmit(onSoumission)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Détails personnels</CardTitle>
              <CardDescription>
                Veuillez saisir les informations personnelles de l&apos;élève.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">
                    Nom<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="nom"
                    placeholder="Nom de famille"
                    required
                    {...register("nom", {
                      required: "Nom est obligatoire",
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
                  <Label htmlFor="prenom">
                    Prénom<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="prenom"
                    placeholder="Prénom"
                    required
                    {...register("prenom", {
                      required: "Prénom est obligatoire",
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

              <div className="space-y-2">
                <Label htmlFor="sexe">
                  Sexe<span className="text-red-500 ml-1">*</span>
                </Label>
                <RadioGroup
                  defaultValue={sexe}
                  onValueChange={(valeur) => setSexe(valeur as "H" | "F")}
                  required
                  id="sexe"
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="H" id="sexe-h" />
                    <Label htmlFor="sexe-h">Homme</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="F" id="sexe-f" />
                    <Label htmlFor="sexe-f">Femme</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_naissance">
                  Date de naissance<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="date"
                  id="date_naissance"
                  name="date_naissance"
                  required
                  value={
                    date_naissance instanceof Date &&
                    !isNaN(date_naissance.getTime())
                      ? format(date_naissance, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setDateNaissance(value ? new Date(value) : undefined);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu_naissance">
                  Lieu de naissance<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="lieu_naissance"
                  placeholder="Lieu de naissance"
                  {...register("lieu_naissance")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pays">
                  Pays<span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  name="id_pays"
                  required
                  onValueChange={(valeur) => setIdPays(Number(valeur))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {pays.map((pays) => (
                      <SelectItem key={pays.id} value={pays.id.toString()}>
                        {pays.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="langue_maternelle">Langue maternelle</Label>
                <Input
                  id="langue_maternelle"
                  placeholder="Langue maternelle"
                  {...register("langue_maternelle")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autres_langues">Autres langues</Label>
                <Input
                  id="autres_langues"
                  placeholder="Autres langues parlées"
                  {...register("autres_langues")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="niveau">Niveau de langue</Label>
                <Select
                  onValueChange={(valeur) =>
                    setNiveau(valeur as "A1" | "A2" | "B1" | "B2" | "C1")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                    <SelectItem value="C1">C1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type_permis">
                  Type de permis<span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  onValueChange={(valeur) =>
                    setTypePermis(valeur as "E" | "S" | "B" | "P")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un type de permis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E">Permis étudiant</SelectItem>
                    <SelectItem value="S">Permis S</SelectItem>
                    <SelectItem value="B">Permis B</SelectItem>
                    <SelectItem value="P">Pas de permis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type_permis !== "P" && (
                <div className="space-y-2">
                  <Label htmlFor="date_permis">
                    Date d&apos;expiration de permis
                  </Label>
                  <Input
                    type="date"
                    id="date_permis"
                    name="date_permis"
                    value={
                      date_permis instanceof Date &&
                      !isNaN(date_permis.getTime())
                        ? format(date_permis, "yyyy-MM-dd")
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setDatePermis(value ? new Date(value) : undefined);
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="src_decouverte">Source de découverte</Label>
                <Textarea
                  id="src_decouverte"
                  placeholder="Comment avez-vous découvert l'école ?"
                  className="min-h-[80px]"
                  {...register("src_decouverte")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commentaire">Commentaires</Label>
                <Textarea
                  id="commentaires"
                  placeholder="Commentaires additionnels"
                  className="min-h-[80px]"
                  {...register("commentaires")}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">
                  Coordonnées de contact
                </CardTitle>
                <CardDescription>
                  Veuillez saisir les coordonnées de l&apos;élève.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">
                    Téléphone<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="+41 XX XXX XX XX"
                    required
                    {...register("telephone", {
                      required: "Numéro de téléphone est obligatoire",
                      setValueAs: (v) => v.trim(),
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemple.ch"
                    required
                    {...register("email", {
                      required: "Adresse email est obligatoire",
                      setValueAs: (v) => v.trim(),
                    })}
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
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
                    <Input
                      id="numero"
                      placeholder="N°"
                      {...register("numero")}
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="npa">NPA</Label>
                    <Input
                      id="npa"
                      placeholder="Code postal"
                      {...register("npa", {
                        setValueAs: (v) => {
                          const t = (v ?? "").trim();
                          return t === "" ? undefined : t;
                        },
                        validate: (v) =>
                          v === undefined ||
                          /^\d{4,6}$/.test(v) ||
                          "Le NPA doit contenir entre 4 et 6 chiffres.",
                      })}
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

                <div className="space-y-2">
                  <Label htmlFor="adresse_facturation">
                    Adresse de facturation
                  </Label>
                  <Textarea
                    id="adresse_facturation"
                    placeholder="Adresse complète pour la facturation"
                    className="min-h-[80px]"
                    {...register("adresse_facturation")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Garant</CardTitle>
                <CardDescription>
                  Si l&apos;élève dispose d&apos;un garant, les informations
                  complémentaires vous seront demandées après la validation de
                  ce formulaire.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="a_garant"
                    checked={a_garant}
                    onCheckedChange={() => setAGarant(!a_garant)}
                  />
                  <Label htmlFor="a_garant">
                    L&apos;élève dispose d&apos;un garant
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="min-w-[150px]"
            disabled={isSubmitting}
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
        </div>
      </form>
    </div>
  );
}
