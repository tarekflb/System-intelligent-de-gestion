"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { debounce } from "lodash";
import { Button } from "@/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/card";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { RadioGroup, RadioGroupItem } from "@/components/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/select";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
}

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
}

interface CoursPrive {
  id: number;
  date_cours_prive: Date;
  heure_debut: string;
  heure_fin: string;
  tarif: number;
  lieu: "E" | "D";
  enseignant: number;
  enseignant__nom: string;
  enseignant__prenom: string;
  eleves_ids: number[];
  eleves: string[];
}

export default function ModifierCoursPrivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm();

  const [recherche, setRecherche] = useState<string>("");
  const [resultats, setResultats] = useState<Eleve[]>([]);
  const [eleves_selectionnes, setElevesSelectionnes] = useState<Eleve[]>([]);

  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [id_enseignant, setIdEnseignant] = useState<number | undefined>(
    undefined,
  );

  const [date_cours_prive, setDateCoursPrive] = useState<Date | undefined>(
    undefined,
  );
  const [heure_debut, setHeureDebut] = useState<string>("");
  const [heure_fin, setHeureFin] = useState<string>("");

  const [lieu, setLieu] = useState<"E" | "D">("E");

  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function fetchDonnees() {
      setChargement(true);

      try {
        const [reponse_cours_prive, reponse_enseignants] = await Promise.all([
          api.get<CoursPrive>(`/cours/cours_prive/${resolvedParams.id}/`),
          api.get<Enseignant[]>("/cours/enseignants/"),
        ]);

        const cours_prive = reponse_cours_prive.data;

        const enseignants = reponse_enseignants.data;

        setDateCoursPrive(new Date(cours_prive.date_cours_prive));

        setHeureDebut(cours_prive.heure_debut.slice(0, 5));
        setHeureFin(cours_prive.heure_fin.slice(0, 5));

        setLieu(cours_prive.lieu === "D" ? "D" : "E");

        reset({
          tarif: cours_prive.tarif,
        });

        setEnseignants(enseignants);

        setIdEnseignant(cours_prive.enseignant);

        if (cours_prive.eleves_ids && cours_prive.eleves_ids.length) {
          const ids_eleves = cours_prive.eleves_ids;

          const reponse = await api.get("/eleves/eleves/", {
            params: { ids: ids_eleves.join(",") },
          });

          setElevesSelectionnes(reponse.data.eleves || []);
        }
      } catch (err) {
        console.error("Erreur", err);
      } finally {
        setChargement(false);
      }
    }

    fetchDonnees();
  }, [reset, resolvedParams.id]);

  const fetchEleves = useCallback((recherche: string) => {
    const debouncedFetch = debounce(async (recherche: string) => {
      if (!recherche) {
        setResultats([]);

        return;
      }

      try {
        const reponse = await api.get("/eleves/eleves/", {
          params: { recherche: recherche },
        });

        setResultats(reponse.data.eleves || []);
      } catch (err) {
        console.error("Erreur: ", err);

        setResultats([]);
      }
    }, 300);

    debouncedFetch(recherche);
  }, []);

  useEffect(() => {
    fetchEleves(recherche);
  }, [recherche, fetchEleves]);

  const ajouterEleve = (e: Eleve) => {
    if (!eleves_selectionnes.find((x) => x.id === e.id)) {
      setElevesSelectionnes((prec) => [...prec, e]);
    }

    setRecherche("");

    setResultats([]);
  };

  const supprimerEleve = (id: number) => {
    setElevesSelectionnes((prec) => prec.filter((x) => x.id !== id));
  };

  const onSoumission = useCallback(
    async (donnees: object) => {
      const donnees_completes = {
        ...donnees,
        date_cours_prive: date_cours_prive
          ? format(date_cours_prive, "yyyy-MM-dd")
          : "",
        heure_debut,
        heure_fin,
        eleves_ids: eleves_selectionnes.map((x) => x.id),
        enseignant: id_enseignant,
        lieu,
      };

      try {
        await api.put(
          `/cours/cours_prive/${resolvedParams.id}/`,
          donnees_completes,
        );

        router.push(
          `/ecole_peg/cours_prives/cours_prive/${resolvedParams.id}/`,
        );
      } catch (err) {
        console.error("Erreur: ", err);
      }
    },
    [
      date_cours_prive,
      eleves_selectionnes,
      heure_debut,
      heure_fin,
      id_enseignant,
      lieu,
      resolvedParams.id,
      router,
    ],
  );

  if (chargement) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push(
              `/ecole_peg/cours_prives/cours_prive/${resolvedParams.id}/`,
            )
          }
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier un cours privé
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSoumission)} className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Éditer le cours privé</CardTitle>
            <CardDescription>
              Modifiez les détails du cours, les élèves et l&apos;enseignant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Label htmlFor="searchEleve" className="text-base">
                Élèves
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Recherchez et ajoutez un ou plusieurs élèves à ce cours privé
              </p>
              <div className="relative">
                <Input
                  id="searchEleve"
                  placeholder="Rechercher par nom ou prénom..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="w-full"
                />
                {resultats.length > 0 && (
                  <ul className="absolute z-10 w-full border rounded-md mt-1 max-h-48 overflow-y-auto bg-white shadow-lg">
                    {resultats.map((x) => (
                      <li
                        key={x.id}
                        className="p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-b-0"
                        onClick={() => ajouterEleve(x)}
                      >
                        {x.nom} {x.prenom}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                {eleves_selectionnes.map((x) => (
                  <span
                    key={x.id}
                    className="px-3 py-1.5 bg-blue-100 rounded-full flex items-center gap-2 text-sm font-medium shadow-sm border border-blue-200 transition-colors hover:bg-blue-200"
                  >
                    {x.nom} {x.prenom}
                    <button
                      type="button"
                      onClick={() => supprimerEleve(x.id)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
                      aria-label={`Retirer ${x.nom} ${x.prenom}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {eleves_selectionnes.length === 0 && (
                  <p className="text-sm text-muted-foreground p-2">
                    Aucun élève sélectionné
                  </p>
                )}
              </div>
            </div>

            {/* === Sélection enseignant === */}
            <div className="space-y-4">
              <Label htmlFor="enseignantSelect" className="text-base">
                Enseignant
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Sélectionnez l&apos;enseignant pour ce cours privé
              </p>
              <Select
                value={id_enseignant?.toString() ?? ""}
                onValueChange={(value) => {
                  setIdEnseignant(Number(value));
                }}
                required
              >
                <SelectTrigger id="enseignantSelect" className="w-full">
                  <SelectValue placeholder="Choisir un enseignant" />
                </SelectTrigger>
                <SelectContent>
                  {enseignants.map((x) => (
                    <SelectItem key={x.id} value={x.id.toString()}>
                      {x.nom} {x.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dateCoursPrive" className="text-base">
                    Date du cours
                  </Label>
                  <Input
                    id="dateCoursPrive"
                    type="date"
                    value={
                      date_cours_prive instanceof Date &&
                      !isNaN(date_cours_prive.getTime())
                        ? format(date_cours_prive, "yyyy-MM-dd")
                        : ""
                    }
                    onChange={(e) =>
                      setDateCoursPrive(new Date(e.target.value))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tarif" className="text-base">
                    Tarif (CHF)
                  </Label>
                  <Input
                    id="tarif"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    onWheel={(e) => e.currentTarget.blur()}
                    {...register("tarif", {
                      required: "Tarif est obligatoire",
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heureDebut" className="text-base">
                    Heure de début
                  </Label>
                  <Input
                    id="heureDebut"
                    type="time"
                    value={heure_debut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heureFin" className="text-base">
                    Heure de fin
                  </Label>
                  <Input
                    id="heureFin"
                    type="time"
                    value={heure_fin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Lieu du cours</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Indiquez où le cours privé aura lieu
                </p>
                <RadioGroup
                  value={lieu}
                  onValueChange={(value) => setLieu(value as "E" | "D")}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex flex-col space-y-1 rounded-lg border p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="E" id="lieu-ecole" />
                      <Label htmlFor="lieu-ecole" className="font-medium">
                        À l&apos;école
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      Le cours aura lieu dans les locaux de l&apos;école
                    </p>
                  </div>

                  <div className="flex flex-col space-y-1 rounded-lg border p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="D" id="lieu-domicile" />
                      <Label htmlFor="lieu-domicile" className="font-medium">
                        À domicile
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      Le cours aura lieu au domicile de l&apos;élève
                    </p>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Modifier le cours privé
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
