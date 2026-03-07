"use client";

import { useEffect, useState } from "react";
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
import { FileText } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Facture {
  id: number;
  date_emission: Date;
  montant_total: number;
  montant_restant: number;
  eleve_nom: string;
  eleve_prenom: string;
}

interface ReponseFactures {
  factures: Facture[];
  nombre_total: number;
}

export default function FacturesPage() {
  const router = useRouter();

  const [factures, setFactures] = useState<Facture[]>([]);
  const [nombre_total, setNombreTotal] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [num_page, setNumPage] = useState(1);
  const taille_page = 10;

  const [filtre_statut, setFiltreStatut] = useState("tous");

  useEffect(() => {
    setNumPage(1);
  }, [filtre_statut]);

  useEffect(() => {
    async function fetchFactures() {
      setChargement(true);
      try {
        const params = {
          page: num_page,
          taille: taille_page,
        };

        let reponse;
        if (filtre_statut === "impayees") {
          reponse = await api.get<ReponseFactures>(
            "/factures/factures/impayees/",
            { params },
          );
        } else if (filtre_statut === "payees") {
          reponse = await api.get<ReponseFactures>(
            "/factures/factures/payees/",
            { params },
          );
        } else {
          reponse = await api.get<ReponseFactures>("/factures/factures/", {
            params,
          });
        }

        setFactures(reponse.data.factures);
        setNombreTotal(reponse.data.nombre_total);
      } catch (err) {
        console.error("Erreur:", err);
        setFactures([]);
        setNombreTotal(0);
      }
      setChargement(false);
    }

    fetchFactures();
  }, [filtre_statut, num_page, taille_page]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les factures de l&apos;école
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des factures</CardTitle>
          <CardDescription>
            Vue d&apos;ensemble des factures émises
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select
            value={filtre_statut}
            onValueChange={(value) => setFiltreStatut(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="payees">Payées</SelectItem>
              <SelectItem value="impayees">Impayées</SelectItem>
            </SelectContent>
          </Select>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Numéro</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Élève</TableHead>
                  <TableHead className="font-medium">Montant</TableHead>
                  <TableHead className="font-medium">Statut</TableHead>
                  <TableHead className="text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factures.length > 0 ? (
                  factures.map((facture) => (
                    <TableRow key={facture.id}>
                      <TableCell>{facture.id}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(facture.date_emission)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {`${facture.eleve_nom} ${facture.eleve_prenom}`}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {facture.montant_total.toLocaleString("fr-CH")} CHF
                        </span>
                        {facture.montant_restant > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Restant:{" "}
                            {facture.montant_restant.toLocaleString("fr-CH")}{" "}
                            CHF
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {facture.montant_restant === 0 ? (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700">
                            Payée
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700">
                            Impayée
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            router.push(
                              `/ecole_peg/factures/facture/${facture.id}`,
                            );
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Détails
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
                      {chargement ? "Chargement..." : "Aucune facture trouvée."}
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
