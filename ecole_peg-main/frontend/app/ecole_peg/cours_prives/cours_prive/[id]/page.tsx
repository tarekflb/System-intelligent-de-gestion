"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/card";
import { Button } from "@/components/button";
import { format, parseISO, isValid } from "date-fns";
import { ArrowLeft, Clock, Users, User, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface CoursPrive {
  id: number;
  date_cours_prive: Date;
  heure_debut: string;
  heure_fin: string;
  tarif: number;
  lieu: "D" | "E";
  enseignant__nom: string;
  enseignant__prenom: string;
  eleves: string[];
}

export default function DetailsCoursPrivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [cours_prive, setCoursPrive] = useState<CoursPrive | undefined>(
    undefined,
  );

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    const parsed = parseISO(`1970-01-01T${timeString}`);
    if (!isValid(parsed)) return "";
    return format(parsed, "HH:mm");
  };

  useEffect(() => {
    async function fetchCoursPrive() {
      try {
        const reponse = await api.get<CoursPrive>(
          `/cours/cours_prive/${resolvedParams.id}/`,
        );

        setCoursPrive(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    fetchCoursPrive();
  }, [resolvedParams.id]);

  if (!cours_prive) {
    return (
      <div className="container mx-auto py-6">
        <Card className="w-full max-w-md mx-auto shadow-sm">
          <CardHeader>
            <CardTitle className="text-center">Chargement...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  async function supprimerCoursPrive() {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce cours privé ?")) {
      return;
    }

    try {
      await api.delete(`/cours/cours_prive/${resolvedParams.id}/`);

      router.push("/ecole_peg/cours_prives/");
    } catch (err) {
      console.error("Erreur: ", err);

      alert("Une erreur est survenue lors de la suppression du cours privé.");
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/ecole_peg/cours_prives/")}
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Détails du cours privé
        </h1>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Cours privé {formatDate(cours_prive.date_cours_prive)}
              </CardTitle>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                cours_prive.lieu === "E"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {cours_prive.lieu === "E" ? "À l'école" : "À domicile"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Horaire
                  </p>
                  <p className="text-sm">
                    {formatTime(cours_prive.heure_debut)} –{" "}
                    {formatTime(cours_prive.heure_fin)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tarif
                  </p>
                  <p className="text-sm">{cours_prive.tarif} CHF</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Enseignant
                  </p>
                  <p className="text-sm">
                    {cours_prive.enseignant__nom}{" "}
                    {cours_prive.enseignant__prenom}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Élèves
                  </p>
                  <p className="text-sm">
                    {cours_prive.eleves.length > 0
                      ? cours_prive.eleves.join(", ")
                      : "Aucun élève inscrit"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-end border-t px-6 py-4 bg-muted/50 space-x-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/ecole_peg/cours_prives/cours_prive/${resolvedParams.id}/modifier/`,
              )
            }
          >
            Modifier
          </Button>
          <Button variant="destructive" onClick={() => supprimerCoursPrive()}>
            Supprimer
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
