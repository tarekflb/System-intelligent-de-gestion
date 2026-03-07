"use client";

import { Button } from "@/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Cours {
  id: number;
  nom: string;
  type_cours: "I" | "S";
  niveau: "A1" | "A2" | "B1" | "B2" | "C1";
  heures_par_semaine: number;
  duree_semaines: number;
  tarif: number;
}

export default function CoursPage() {
  const router = useRouter();

  const [cours, setCours] = useState<Cours[]>([]);

  const [filtre_type_cours, setFiltreType] = useState("tous");

  const [filtre_niveau, setFiltreNiveau] = useState("tous");

  const fetchCours = useCallback(async () => {
    try {
      const reponse = await api.get<Cours[]>("/cours/cours/");

      setCours(reponse.data);
    } catch (err) {
      console.error("Erreur: ", err);
    }
  }, []);

  useEffect(() => {
    fetchCours();
  }, [fetchCours]);

  async function supprimerCours(id_cours: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) {
      return;
    }

    try {
      await api.delete(`/cours/cours/${id_cours}/`);

      fetchCours();
    } catch (err) {
      console.error("Erreur: ", err);

      alert("Une erreur est survenue lors de la suppression du cours.");
    }
  }

  const filtres_cours = cours.filter((c) => {
    const typeOk =
      filtre_type_cours === "tous" || c.type_cours === filtre_type_cours;

    const niveauOk = filtre_niveau === "tous" || c.niveau === filtre_niveau;

    return typeOk && niveauOk;
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Cours</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les cours de l&apos;école
          </p>
        </div>
        <Button
          onClick={() => {
            router.push("/ecole_peg/cours/cours");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau cours
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des cours</CardTitle>
          <CardDescription>
            Vue d&apos;ensemble des cours disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={filtre_niveau}
              onValueChange={(value) => setFiltreNiveau(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les niveaux</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filtre_type_cours}
              onValueChange={(value) => setFiltreType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="I">Intensif</SelectItem>
                <SelectItem value="S">Semi-intensif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Nom</TableHead>
                  <TableHead className="font-medium">Type</TableHead>
                  <TableHead className="font-medium">Niveau</TableHead>
                  <TableHead className="font-medium">Durée</TableHead>
                  <TableHead className="font-medium">Tarif</TableHead>
                  <TableHead className="text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtres_cours.length > 0 ? (
                  filtres_cours.map((cours) => (
                    <TableRow key={cours.id}>
                      <TableCell className="font-medium">{cours.nom}</TableCell>
                      <TableCell>
                        {cours.type_cours === "I"
                          ? "Intensif"
                          : "Semi-intensif"}
                      </TableCell>
                      <TableCell>{cours.niveau}</TableCell>
                      <TableCell>
                        {cours.heures_par_semaine}h/semaine ·{" "}
                        {cours.duree_semaines} semaines
                      </TableCell>
                      <TableCell>{cours.tarif} CHF</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            router.push(
                              `/ecole_peg/cours/cours/${cours.id}/modifier/`,
                            );
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => supprimerCours(cours.id)}
                        >
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucun cours trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
