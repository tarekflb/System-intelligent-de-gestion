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
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
}

export default function EnseignantsPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);

  const router = useRouter();

  const fetchEnseignants = useCallback(async () => {
    try {
      const reponse = await api.get<Enseignant[]>("/cours/enseignants/");

      setEnseignants(reponse.data);
    } catch (err) {
      console.error("Erreur: ", err);
    }
  }, []);

  useEffect(() => {
    fetchEnseignants();
  }, [fetchEnseignants]);

  async function supprimerEnseignant(id_enseignant: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet enseignant ?")) {
      return;
    }

    try {
      await api.delete(`/cours/enseignants/${id_enseignant}/`);

      fetchEnseignants();
    } catch (err) {
      console.error("Erreur: ", err);

      alert("Une erreur est survenue lors de la suppression de l'enseignant.");
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Enseignants</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les enseignants de l&apos;école
          </p>
        </div>
        <Button
          onClick={() => router.push("/ecole_peg/enseignants/enseignant")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau enseignant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des enseignants</CardTitle>
          <CardDescription>
            Vue d&apos;ensemble du corps enseignant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Nom</TableHead>
                  <TableHead className="font-medium">Prénom</TableHead>
                  <TableHead className="text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enseignants.length > 0 ? (
                  enseignants.map((enseignant) => (
                    <TableRow key={enseignant.id}>
                      <TableCell className="font-medium">
                        {enseignant.nom}
                      </TableCell>
                      <TableCell>{enseignant.prenom}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => supprimerEnseignant(enseignant.id)}
                        >
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucun enseignant trouvé.
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
