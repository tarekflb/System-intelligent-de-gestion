"use client";

import Link from "next/link";
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
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface Session {
  id: number;
  cours__nom: string;
  cours__niveau: "A1" | "A2" | "B1" | "B2" | "C1";
  date_debut: Date;
  date_fin: Date;
  statut: "O" | "F";
  cours__type_cours: "I" | "S";
}

export default function SessionsPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);

  const [num_page, setNumPage] = useState<number>(1);
  const [taille] = useState<number>(10);

  const [total, setTotal] = useState<number>(0);
  const [chargement, setChargement] = useState(false);

  const [filtre_type, setFiltreType] = useState<"tous" | "I" | "S">("tous");
  const [filtre_niveau, setFiltreNiveau] = useState<
    "tous" | "A1" | "A2" | "B1" | "B2" | "C1"
  >("tous");

  useEffect(() => {
    async function fetchSessions() {
      setChargement(true);

      try {
        const params: Record<string, string | number | undefined> = {
          page: num_page,
          taille: taille,
        };

        if (filtre_type && filtre_type !== "tous") params.type = filtre_type;

        if (filtre_niveau && filtre_niveau !== "tous")
          params.niveau = filtre_niveau;

        const reponse = await api.get<{
          sessions: Session[];
          nombre_total: number;
        }>("/cours/sessions/", { params });

        setSessions(reponse.data.sessions);

        setTotal(reponse.data.nombre_total);
      } catch (err) {
        setSessions([]);

        setTotal(0);

        console.error("Erreur: ", err);
      }

      setChargement(false);
    }

    fetchSessions();
  }, [filtre_niveau, filtre_type, num_page, taille]);

  useEffect(() => {
    setNumPage(1);
  }, [filtre_niveau, filtre_type]);

  const pages_totales = Math.ceil(total / taille);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les sessions de l&apos;école
          </p>
        </div>
        <Button
          onClick={() => {
            router.push("/ecole_peg/sessions/session");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle session
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des sessions</CardTitle>
          <CardDescription>
            Vue d&apos;ensemble des sessions de cours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={filtre_niveau}
              onValueChange={(value) =>
                setFiltreNiveau(
                  value as "tous" | "A1" | "A2" | "B1" | "B2" | "C1",
                )
              }
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
              value={filtre_type}
              onValueChange={(value) =>
                setFiltreType(value as "tous" | "I" | "S")
              }
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
                  <TableHead className="font-medium">Période</TableHead>
                  <TableHead className="font-medium">Statut</TableHead>
                  <TableHead className="text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chargement ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : sessions.length > 0 ? (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {session.cours__nom}
                      </TableCell>
                      <TableCell>
                        {session.cours__type_cours === "I"
                          ? "Intensif"
                          : "Semi-intensif"}
                      </TableCell>
                      <TableCell>{session.cours__niveau}</TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap">
                          Du {formatDate(session.date_debut)} au{" "}
                          {formatDate(session.date_fin)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            session.statut === "O"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {session.statut === "O" ? "Ouverte" : "Fermée"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/ecole_peg/sessions/session/${session.id}`}
                          >
                            Détails
                          </Link>
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
                      Aucune session trouvée.
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
                Page {num_page} sur {pages_totales || 1}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setNumPage((p) => Math.min(pages_totales, p + 1))
                }
                disabled={num_page === pages_totales || pages_totales === 0}
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
