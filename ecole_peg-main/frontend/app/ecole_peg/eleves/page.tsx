"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { format } from "date-fns";
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
import { Input } from "@/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: Date;
  telephone: string;
  email: string;
  pays__nom: string;
}

interface ReponseEleves {
  eleves: Eleve[];
  nombre_total: number;
}

export default function ElevesPage() {
  const [date_naissance, setDateNaissance] = useState<Date | undefined>(
    undefined,
  );
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [nombre_total, setNombreTotal] = useState(0);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(false);
  const [num_page, setNumPage] = useState(1);
  const [statut, setStatut] = useState<"A" | "I" | "P" | "tous">("A");
  const taille_page = 10;

  useEffect(() => {
    setNumPage(1);
  }, [date_naissance, statut]);

  useEffect(() => {
    async function fetchData() {
      setChargement(true);

      try {
        const params: Record<string, string | number | undefined> = {
          page: num_page,
          taille: taille_page,
          statut: statut,
        };

        if (recherche) params.recherche = recherche;

        if (date_naissance)
          params.date_naissance = format(date_naissance, "yyyy-MM-dd");

        const response = await api.get<ReponseEleves>("/eleves/eleves/", {
          params,
        });

        setEleves(response.data.eleves ?? []);

        setNombreTotal(response.data.nombre_total ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        setChargement(false);
      }
    }

    fetchData();
  }, [num_page, date_naissance, statut, recherche]);

  const pages_totales = Math.ceil(nombre_total / taille_page);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Élèves</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les élèves de l&apos;école
          </p>
        </div>
        <Button asChild>
          <Link href="/ecole_peg/eleves/eleve">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un élève
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des élèves</CardTitle>
          <CardDescription>
            Tous les élèves inscrits à l&apos;école
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher un élève..."
                  className="pl-8"
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                  }}
                />
              </div>
              <Input
                type="date"
                className="w-[200px]"
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
              <Select
                value={statut}
                onValueChange={(e) => setStatut(e as "A" | "I" | "P" | "tous")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut des élèves" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Actifs</SelectItem>
                  <SelectItem value="I">Inactifs</SelectItem>
                  <SelectItem value="P">Préinscrits</SelectItem>
                  <SelectItem value="tous">Tous les élèves</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {chargement && (
              <div className="flex justify-center p-4">
                <div className="text-sm text-muted-foreground">
                  Chargement...
                </div>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Nom</TableHead>
                    <TableHead className="font-medium">Prénom</TableHead>
                    <TableHead className="font-medium">
                      Date de naissance
                    </TableHead>
                    <TableHead className="font-medium">Téléphone</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Pays</TableHead>
                    <TableHead className="text-right font-medium">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eleves.length > 0 ? (
                    eleves.map((eleve) => (
                      <TableRow key={eleve.id}>
                        <TableCell className="font-medium">
                          {eleve.nom ?? "-"}
                        </TableCell>
                        <TableCell>{eleve.prenom ?? "-"}</TableCell>
                        <TableCell>
                          {eleve.date_naissance
                            ? formatDate(eleve.date_naissance)
                            : "-"}
                        </TableCell>
                        <TableCell>{eleve.telephone ?? "-"}</TableCell>
                        <TableCell>{eleve.email ?? "-"}</TableCell>
                        <TableCell>{eleve.pays__nom ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/ecole_peg/eleves/eleve/${eleve.id}`}>
                              Détails
                            </Link>
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
                        Aucun élève trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end space-x-4 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNumPage((prec) => Math.max(prec - 1, 1))}
                disabled={num_page === 1}
              >
                Précédent
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {num_page} sur {pages_totales}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setNumPage((prec) => prec + 1)}
                disabled={num_page === pages_totales}
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
