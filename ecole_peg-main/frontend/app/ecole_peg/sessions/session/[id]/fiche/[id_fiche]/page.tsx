"use client";

import { use, useState, useEffect } from "react";
import { Button } from "@/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
}

interface Presence {
  id: number;
  id_eleve: number;
  date_presence: Date;
  statut: "P" | "A";
}

interface FichePresences {
  id: number;
  mois:
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
    | "12";
  annee: number;
  presences: Presence[];
}

type MapPresences = Record<number, Record<number, Presence>>;

export default function FichePresencePage({
  params,
}: {
  params: Promise<{ id: string; id_fiche: string }>;
}) {
  const resolvedParams = use(params);

  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [fiche, setFiche] = useState<FichePresences>();

  const [map_presences, setMapPresences] = useState<MapPresences>({});
  const [chargement, setChargement] = useState(true);

  const router = useRouter();

  useEffect(() => {
    async function fetchDonnees() {
      setChargement(true);

      try {
        const [reponse_eleves, reponse_fiche] = await Promise.all([
          api.get<Eleve[]>(`/cours/session/${resolvedParams.id}/eleves/`),
          api.get<FichePresences>(
            `/cours/fiche_presences/${resolvedParams.id_fiche}/`,
          ),
        ]);

        setEleves(reponse_eleves.data);
        setFiche(reponse_fiche.data);

        const map2d: MapPresences = {};

        reponse_fiche.data.presences.forEach((p) => {
          const jour = new Date(p.date_presence).getUTCDate();

          if (!map2d[p.id_eleve]) map2d[p.id_eleve] = {};

          map2d[p.id_eleve][jour] = p;
        });

        setMapPresences(map2d);
      } catch (err) {
        console.error("Erreur: ", err);
      } finally {
        setChargement(false);
      }
    }

    fetchDonnees();
  }, [resolvedParams.id, resolvedParams.id_fiche]);

  if (chargement || !fiche) {
    return <div>Chargement…</div>;
  }

  const indiceMois = parseInt(fiche.mois, 10) - 1;
  const dernierJour = new Date(fiche.annee, indiceMois + 1, 0).getDate();
  const joursDuMois = Array.from({ length: dernierJour }, (_, i) => i + 1);

  function totalPresences(id_eleve: number) {
    return Object.values(map_presences[id_eleve] || {}).filter(
      (p) => p.statut === "P",
    ).length;
  }

  function togglePresence(id_eleve: number, jour: number) {
    setMapPresences((prec) => {
      const suiv = { ...prec };
      const map_eleves = { ...(suiv[id_eleve] || {}) };
      const existant = map_eleves[jour];

      map_eleves[jour] = {
        ...existant,
        statut: existant.statut === "P" ? "A" : "P",
      };

      suiv[id_eleve] = map_eleves;

      return suiv;
    });
  }

  async function handleSave() {
    const toutes_presences = Object.values(map_presences).flatMap((par_jour) =>
      Object.values(par_jour),
    );

    const a_modifier = toutes_presences.map((p) => ({
      id: p.id,
      statut: p.statut === "P" ? "P" : "A",
    }));

    try {
      await api.put(
        `/cours/fiche_presences/${resolvedParams.id_fiche}/`,
        a_modifier,
      );

      router.push(`/ecole_peg/sessions/session/${resolvedParams.id}/`);
    } catch (err) {
      console.error("Erreur :", err);
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Fiche de présence
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(fiche.annee, indiceMois), "MMMM yyyy", {
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="shadow-sm">
          <Save className="mr-2 h-4 w-4" /> Enregistrer
        </Button>
      </div>

      {chargement ? (
        <Card className="w-full max-w-md mx-auto shadow-sm">
          <CardHeader>
            <CardTitle className="text-center">Chargement...</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Suivi des présences</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="w-[200px] bg-muted/50 left-0 sticky z-10">
                      Élève
                    </TableHead>
                    {joursDuMois.map((j) => (
                      <TableHead
                        key={j}
                        className="text-center p-2 min-w-[40px]"
                      >
                        {j}
                      </TableHead>
                    ))}
                    <TableHead className="text-right bg-muted/50 right-0 sticky z-10 min-w-[80px]">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eleves.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium bg-white/80 left-0 sticky z-10">
                        {e.nom} {e.prenom}
                      </TableCell>
                      {joursDuMois.map((j) => {
                        const p = map_presences[e.id]?.[j];

                        return (
                          <TableCell key={j} className="text-center p-0">
                            <button
                              className={`w-full h-10 transition duration-150 ${
                                p?.statut === "P"
                                  ? "bg-primary/10 hover:bg-primary/20 text-primary font-medium"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => togglePresence(e.id, j)}
                            >
                              {p?.statut === "P" ? "✓" : "–"}
                            </button>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-medium bg-white/80 right-0 sticky z-10">
                        {totalPresences(e.id)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="border-t p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Heures-Participant = Nombre de présences × 3h (durée du cours)
              </p>
              <p className="text-lg font-bold">
                Total:{" "}
                {eleves.reduce((acc, e) => acc + totalPresences(e.id), 0) * 3}{" "}
                heures participant
              </p>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
