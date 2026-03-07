"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
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
import { RadioGroupItem } from "@/components/radio-group";
import { ArrowLeft, Save } from "lucide-react";
import { Textarea } from "@/components/textarea";
import { RadioGroup } from "@/components/radio-group";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";

interface Pays {
  id: number;
  nom: string;
}

interface Eleve {
  nom: string;
  prenom: string;
  lieu_naissance: string;
  rue?: string;
  numero?: string;
  npa?: string;
  localite?: string;
  telephone: string;
  email: string;
  adresse_facturation?: string;
  langue_maternelle?: string;
  autres_langues?: string;
  src_decouverte?: string;
  commentaires?: string;
}

export default function ModifierElevePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [sexe, setSexe] = useState<"H" | "F">("H");
  const [date_naissance, setDateNaissance] = useState<Date | undefined>(
    undefined,
  );
  const [niveau, setNiveau] = useState<"A1" | "A2" | "B1" | "B2" | "C1">("A1");
  const [type_permis, setTypePermis] = useState<"E" | "S" | "B" | "P">("P");
  const [date_permis, setDatePermis] = useState<Date | undefined>(undefined);
  const [pays, setPays] = useState<Pays[]>([]);
  const [id_pays, setIdPays] = useState<number>(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Eleve>();

  const fetchDonnees = useCallback(async () => {
    try {
      const [reponse_eleves, reponse_pays] = await Promise.all([
        api.get(`/eleves/eleve/${resolvedParams.id}/`),
        api.get<Pays[]>(`/eleves/pays/`),
      ]);

      const eleve = reponse_eleves.data;

      setPays(reponse_pays.data);

      setSexe(eleve.sexe);

      setDateNaissance(new Date(eleve.date_naissance));

      setNiveau(eleve.niveau);

      setTypePermis(eleve.type_permis);

      setDatePermis(
        eleve.date_permis ? new Date(eleve.date_permis) : undefined,
      );

      setIdPays(eleve.pays_id);

      reset({
        nom: eleve.nom,
        prenom: eleve.prenom,
        lieu_naissance: eleve.lieu_naissance,
        telephone: eleve.telephone,
        email: eleve.email,
        rue: eleve.rue,
        numero: eleve.numero,
        npa: eleve.npa,
        localite: eleve.localite,
        adresse_facturation: eleve.adresse_facturation,
        langue_maternelle: eleve.langue_maternelle,
        autres_langues: eleve.autres_langues,
        src_decouverte: eleve.src_decouverte,
        commentaires: eleve.commentaires,
      });
    } catch (err) {
      console.error(err);
    }
  }, [reset, resolvedParams.id]);

  useEffect(() => {
    fetchDonnees();
  }, [fetchDonnees]);

  const onSoumission = useCallback(
    async (donnees: Eleve) => {
      if (date_naissance && date_naissance > new Date()) {
        alert("Date de naissance ne peut pas être dans le futur");

        return;
      }

      const payload = {
        ...donnees,
        sexe,
        date_naissance: date_naissance
          ? format(date_naissance, "yyyy-MM-dd")
          : undefined,
        niveau,
        type_permis: type_permis,
        date_permis: date_permis
          ? format(date_permis, "yyyy-MM-dd")
          : undefined,
        pays_id: id_pays,
      };

      try {
        await api.put(`/eleves/eleves/${resolvedParams.id}/`, payload);

        router.push(`/ecole_peg/eleves/eleve/${resolvedParams.id}/`);
      } catch (err) {
        if (isAxiosError(err) && err.response?.data?.erreurs) {
          const erreurs = err.response.data.erreurs;

          Object.entries(erreurs).forEach(([msgs]) => {
            alert((msgs as unknown as string[]).join(", "));
          });
        } else {
          console.error(err);
        }
      }
    },
    [
      date_naissance,
      date_permis,
      id_pays,
      niveau,
      resolvedParams.id,
      router,
      sexe,
      type_permis,
    ],
  );

  if (pays.length === 0) {
    return <div>Chargement…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Modifier l&apos;élève
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSoumission)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Détails personnels</CardTitle>
              <CardDescription>
                Informations personnelles de l&apos;élève
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-base">
                    Nom
                  </Label>
                  <Input
                    id="nom"
                    className="font-medium"
                    {...register("nom", { required: "Nom est obligatoire" })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-base">
                    Prénom
                  </Label>
                  <Input
                    id="prenom"
                    className="font-medium"
                    {...register("prenom", {
                      required: "Prénom est obligatoire",
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Sexe</Label>
                <RadioGroup
                  value={sexe}
                  onValueChange={(value) => setSexe(value as "H" | "F")}
                  className="grid grid-cols-2 gap-4"
                >
                  <div
                    className={`relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                      sexe === "H" ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <RadioGroupItem value="H" id="sexe-h" />
                    <Label
                      htmlFor="sexe-h"
                      className="font-medium cursor-pointer"
                    >
                      Homme
                    </Label>
                  </div>
                  <div
                    className={`relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                      sexe === "F" ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <RadioGroupItem value="F" id="sexe-f" />
                    <Label
                      htmlFor="sexe-f"
                      className="font-medium cursor-pointer"
                    >
                      Femme
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Date de naissance</Label>
                <Input
                  type="date"
                  id="date_naissance"
                  name="date_naissance"
                  required
                  className="font-mono"
                  value={
                    date_naissance instanceof Date &&
                    !isNaN(date_naissance.getTime())
                      ? format(date_naissance, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => {
                    setDateNaissance(new Date(e.target.value));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu_naissance" className="text-base">
                  Lieu de naissance
                </Label>
                <Input
                  id="lieu_naissance"
                  className="font-medium"
                  {...register("lieu_naissance")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pays" className="text-base">
                  Pays d&apos;origine
                </Label>
                <Select
                  value={String(id_pays)}
                  onValueChange={(v) => setIdPays(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Séléctionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {pays.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="langue_maternelle" className="text-base">
                  Langue maternelle
                </Label>
                <Input
                  id="langue_maternelle"
                  className="font-medium"
                  {...register("langue_maternelle")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autres_langues" className="text-base">
                  Autres langues
                </Label>
                <Input
                  id="autres_langues"
                  className="font-medium"
                  placeholder="Séparées par des virgules"
                  {...register("autres_langues")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
              <CardDescription>
                Informations de contact et adresse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-base">
                  Téléphone
                </Label>
                <Input
                  id="telephone"
                  className="font-mono"
                  {...register("telephone", {
                    required: "Téléphone obligatoire",
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="font-medium"
                  {...register("email", { required: "Email obligatoire" })}
                />
              </div>

              <div className="relative rounded-lg border bg-card p-4 space-y-4">
                <h3 className="font-medium">Adresse</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rue" className="text-sm">
                      Rue
                    </Label>
                    <Input id="rue" {...register("rue")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero" className="text-sm">
                      Numéro
                    </Label>
                    <Input id="numero" {...register("numero")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="npa" className="text-sm">
                      NPA
                    </Label>
                    <Input
                      id="npa"
                      className="font-mono"
                      {...register("npa")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localite" className="text-sm">
                      Localité
                    </Label>
                    <Input id="localite" {...register("localite")} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse_facturation" className="text-base">
                  Adresse de facturation
                  <span className="text-sm text-muted-foreground ml-2">
                    (si différente)
                  </span>
                </Label>
                <Textarea
                  id="adresse_facturation"
                  placeholder="Laisser vide si identique à l'adresse principale"
                  className="min-h-[100px]"
                  {...register("adresse_facturation")}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Niveau & Permis de séjour</CardTitle>
            <CardDescription>
              Niveau de langue et informations administratives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-base">Niveau de langue</Label>
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

              <div className="space-y-4">
                <Label className="text-base">Type de permis</Label>
                <RadioGroup
                  value={type_permis}
                  onValueChange={(value) =>
                    setTypePermis(value as "E" | "S" | "B" | "P")
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  {[
                    {
                      value: "E",
                      label: "Permis étudiant",
                      desc: "Pour les étudiants",
                    },
                    {
                      value: "S",
                      label: "Permis S",
                      desc: "Protection temporaire",
                    },
                    { value: "B", label: "Permis B", desc: "Séjour annuel" },
                    {
                      value: "P",
                      label: "Pas de permis",
                      desc: "Aucun permis requis",
                    },
                  ].map(({ value, label, desc }) => (
                    <div
                      key={value}
                      className={`flex flex-col space-y-1 rounded-lg border p-4 cursor-pointer transition-colors ${
                        type_permis === value
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={value}
                          id={`permis-${value}`}
                          className="sr-only"
                        />
                        <div
                          className={`w-2 h-2 rounded-full ${
                            type_permis === value ? "bg-primary" : "bg-muted"
                          }`}
                        />
                        <Label
                          htmlFor={`permis-${value}`}
                          className="font-medium cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground pl-4">
                        {desc}
                      </p>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {type_permis !== "P" && (
                <div className="space-y-2">
                  <Label className="text-base">Date du permis</Label>
                  <Input
                    type="date"
                    id="date_permis"
                    name="date_permis"
                    className="font-mono"
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
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="src_decouverte" className="text-base">
                  Comment avez-vous connu l&apos;école ?
                </Label>
                <Textarea
                  id="src_decouverte"
                  placeholder="Internet, recommandation, publicité..."
                  {...register("src_decouverte")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commentaires" className="text-base">
                  Commentaires
                  <span className="text-sm text-muted-foreground ml-2">
                    (optionnel)
                  </span>
                </Label>
                <Textarea
                  id="commentaires"
                  placeholder="Informations supplémentaires..."
                  className="min-h-[100px]"
                  {...register("commentaires")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
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
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting
              ? "Enregistrement..."
              : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}
