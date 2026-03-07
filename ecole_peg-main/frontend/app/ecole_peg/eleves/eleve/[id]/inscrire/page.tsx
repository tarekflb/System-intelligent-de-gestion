"use client";

import { useCallback, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import {
  Card,
  CardContent,
  CardFooter,
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
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/checkbox";
import { formatDate } from "@/lib/utils";

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
}

interface Session {
  id: number;
  cours__nom: string;
  cours__type_cours: "I" | "S";
  cours__niveau: string;
  date_debut: string; // la réponse est une string ISO
  date_fin: string;
}


export default function InscrirePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const router = useRouter();

  const resolvedParams = use(params);

  const [eleve, setEleve] = useState<Eleve | undefined>(undefined);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [id_session, setIdSession] = useState<number>();
  const [preinscription, setPreinscription] = useState<boolean>(false);

  const onSoumission = useCallback(
    async (donnees: object) => {
      const donnees_completes = {
        ...donnees,
        id_session,
        preinscription,
      };

      try {
        await api.post(
          `/cours/${resolvedParams.id}/inscription/`,
          donnees_completes,
        );

        router.push(`/ecole_peg/eleves/eleve/${resolvedParams?.id}/`);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    },
    [id_session, preinscription, resolvedParams.id, router],
  );

  useEffect(() => {
    async function fetchEleve() {
      try {
        const reponse = await api.get<Eleve>(
          `/eleves/eleve/${resolvedParams.id}/`,
        );

        setEleve(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    async function fetchSessions() {
      try {
        const params = {
          statut: "O",
        };

        const reponse = await api.get("/cours/sessions/", { params });

        setSessions(reponse.data.sessions);
      } catch (erreur) {
        console.error("Erreur: ", erreur);
      }
    }

    fetchEleve();
    fetchSessions();
  }, [resolvedParams.id]);

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
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
        <h1 className="text-3xl font-bold tracking-tight">
          Inscription aux cours pour {eleve?.nom} {eleve?.prenom}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSoumission)} className="space-y-6">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">
              Détails de l&apos;inscription
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select
                name="session"
                required
                onValueChange={(valeur) => {
                  setIdSession(Number(valeur));
                }}
              >
                <SelectTrigger className="w-full" id="session">
                  <SelectValue placeholder="Sélectionner la session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      <span className="font-medium">{session.cours__nom}</span>{" "}
                      -{" "}
                      {session.cours__type_cours === "I"
                        ? "Intensif"
                        : "Semi-intensif"}{" "}
                      <span className="font-medium">
                        {session.cours__niveau}
                      </span>
                      <br />
                      <span className="text-sm text-muted-foreground">
                        Du {formatDate(new Date(session.date_debut))} au{" "}
                        {formatDate(new Date(session.date_fin))}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="but">But de l&apos;inscription</Label>
              <Input
                id="but"
                placeholder="Ex: Perfectionnement du français, Préparation aux études..."
                {...register("but")}
                className="w-full"
              />
            </div>


            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="preinscription"
                  checked={preinscription}
                  onCheckedChange={(checked) =>
                    setPreinscription(checked as boolean)
                  }
                />
                <Label
                  htmlFor="preinscription"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Préinscription uniquement
                </Label>
              </div>
              {preinscription && (
                <p className="mt-2 text-sm text-muted-foreground">
                  La préinscription permet de réserver une place dans la session
                  sans confirmation définitive.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              className="min-w-[150px]"
              disabled={isSubmitting || !id_session}
            >
              {isSubmitting ? (
                <>Sauvegarde en cours...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
