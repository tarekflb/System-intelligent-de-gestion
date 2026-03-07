"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/card";
import { Plus } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/table";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface CoursPrive {
  id: number;
  date_cours_prive: Date;
  heure_debut: string;
  heure_fin: string;
  tarif: number;
  lieu: "E" | "D";

  enseignant__nom: string;
  enseignant__prenom: string;

  eleves: string[];
}

interface ReponseCoursPrives {
  cours_prives: CoursPrive[];
  nombre_total: number;
}

export default function CoursPrivesPage() {
  const router = useRouter();

  const [cours_prives, setCoursPrives] = useState<CoursPrive[]>([]);
  const [nombre_total, setNombreTotal] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [num_page, setNumPage] = useState(1);
  const taille_page = 10;

  useEffect(() => {
    async function fetchCoursPrives() {
      setChargement(true);
      try {
        const params: Record<string, string | number> = {
          page: num_page,
          taille: taille_page,
        };

        const reponse = await api.get<ReponseCoursPrives>(
          "/cours/cours_prive/",
          {
            params,
          },
        );

        setCoursPrives(reponse.data.cours_prives);
        setNombreTotal(reponse.data.nombre_total);
      } catch (err) {
        console.error("Erreur: ", err);
        setCoursPrives([]);
        setNombreTotal(0);
      }
      setChargement(false);
    }

    fetchCoursPrives();
  }, [num_page, taille_page]);

  const formatTime = (string_temps: string) => {
    if (!string_temps) return "";

    const parsed = parseISO(`1970-01-01T${string_temps}`);

    if (!isValid(parsed)) return "";

    return format(parsed, "HH:mm");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Cours Privés</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les cours privés de l&apos;école
          </p>
        </div>
        <Button
          onClick={() => {
            router.push("/ecole_peg/cours_prives/cours_prive");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau cours privé
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des cours privés</CardTitle>
          <CardDescription>
            Vue d&apos;ensemble des cours particuliers planifiés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Horaire</TableHead>
                  <TableHead className="font-medium">Élève(s)</TableHead>
                  <TableHead className="font-medium">Enseignant</TableHead>
                  <TableHead className="font-medium">Tarif</TableHead>
                  <TableHead className="font-medium">Lieu</TableHead>
                  <TableHead className="text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cours_prives.length > 0 ? (
                  cours_prives.map((cours) => (
                    <TableRow key={cours.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(cours.date_cours_prive)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatTime(cours.heure_debut)} –{" "}
                        {formatTime(cours.heure_fin)}
                      </TableCell>
                      <TableCell>
                        {cours.eleves.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {cours.eleves.map((eleve, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700"
                              >
                                {eleve}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Aucun élève
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {cours.enseignant__nom} {cours.enseignant__prenom}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {typeof cours.tarif === "number"
                          ? cours.tarif.toLocaleString("fr-CH")
                          : cours.tarif}{" "}
                        CHF
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-700">
                          {cours.lieu === "E"
                            ? "École"
                            : cours.lieu === "D"
                              ? "Domicile"
                              : cours.lieu}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            router.push(
                              `/ecole_peg/cours_prives/cours_prive/${cours.id}`,
                            );
                          }}
                        >
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-muted-foreground"
                    >
                      {chargement
                        ? "Chargement..."
                        : "Aucun cours privé trouvé."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-4 py-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNumPage((p) => Math.max(1, p - 1))}
                disabled={num_page === 1}
              >
                Précédent
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {num_page} sur {Math.ceil(nombre_total / taille_page) || 1}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setNumPage((p) =>
                    Math.min(Math.ceil(nombre_total / taille_page), p + 1),
                  )
                }
                disabled={
                  num_page === Math.ceil(nombre_total / taille_page) ||
                  nombre_total === 0
                }
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
