"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { formatDate } from "@/lib/utils";

interface Facture {
  id: number;
  date_emission: Date;
  montant_total: number;
  montant_restant: number;
  eleve_nom: string;
  eleve_prenom: string;
}

export default function PayerFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm();

  const resolvedParams = use(params);
  const router = useRouter();

  const [facture, setFacture] = useState<Facture>();

  const [mode_paiement, setModePaiement] = useState<
    "PER" | "BPA" | "CAF" | "HOS" | "AUT"
  >("PER");

  const [methode_paiement, setMethodePaiement] = useState<
    "ESP" | "CAR" | "VIR" | "TWI" | "TEL" | "PAY" | "AUT" | undefined
  >("ESP");

  const montant = watch("montant");

  useEffect(() => {
    async function fetchFacture() {
      try {
        const reponse = await api.get<Facture>(
          `/factures/facture/${resolvedParams.id}/`
        );

        setFacture(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    fetchFacture();
  }, [resolvedParams.id]);

  const onSoumission = useCallback(
    async (donnees: object) => {
      if (mode_paiement === "PER" && !methode_paiement) {
        alert("Vous devez choisir une méthode de paiement.");

        return;
      }

      if (mode_paiement !== "PER" && methode_paiement) {
        setMethodePaiement(undefined);
      }

      const donnees_completes = {
        ...donnees,
        id_facture: resolvedParams.id,
        mode_paiement,
        methode_paiement,
      };

      console.log(donnees_completes);

      try {
        await api.post("/factures/paiement/", donnees_completes);

        router.push(`/ecole_peg/factures/facture/${resolvedParams.id}`);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    },
    [methode_paiement, mode_paiement, resolvedParams.id, router]
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push(`/ecole_peg/factures/facture/${resolvedParams.id}/`)
          }
          aria-label="Retourner à la page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Paiement Facture</h1>
      </div>

      {!facture ? (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">Chargement de la facture...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSoumission)}>
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">
                Facture {facture.id}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Émise le {formatDate(facture.date_emission)}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-card p-4 text-card-foreground">
                <div className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Élève :
                    </span>
                    <span className="font-medium">
                      {facture.eleve_nom} {facture.eleve_prenom}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Montant total
                      </span>
                      <p className="font-medium">{facture.montant_total} CHF</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Montant restant
                      </span>
                      <p className="font-medium text-blue-600">
                        {facture.montant_restant} CHF
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="montant" className="text-base">
                    Montant du paiement
                  </Label>
                  <div className="relative">
                    <Input
                      id="montant"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={facture.montant_restant}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="pl-8 font-mono"
                      placeholder="0.00"
                      {...register("montant", {
                        required: "Montant est obligatoire",
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Maximum: {facture.montant_restant} CHF
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Mode de paiement</Label>
                  <Select
                    value={mode_paiement}
                    onValueChange={(value) => {
                      setModePaiement(
                        value as "PER" | "BPA" | "CAF" | "HOS" | "AUT"
                      );

                      if (value !== "PER") setMethodePaiement(undefined);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un mode de paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER">Personnel</SelectItem>
                      <SelectItem value="BPA">BPA</SelectItem>
                      <SelectItem value="CAF">CAF</SelectItem>
                      <SelectItem value="HOP">Hospice</SelectItem>
                      <SelectItem value="AUT">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mode_paiement === "PER" && (
                  <div className="space-y-2">
                    <Label className="text-base">Méthode de paiement</Label>
                    <Select
                      value={methode_paiement}
                      onValueChange={(value) =>
                        setMethodePaiement(
                          value as
                            | "ESP"
                            | "CAR"
                            | "VIR"
                            | "TWI"
                            | "TEL"
                            | "PAY"
                            | "AUT"
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisir une méthode de paiement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ESP">Espèces</SelectItem>
                        <SelectItem value="VIR">Virement bancaire</SelectItem>
                        <SelectItem value="CAR">Carte bancaire</SelectItem>
                        <SelectItem value="TEL">Paiement mobile</SelectItem>
                        <SelectItem value="TWI">Twint</SelectItem>
                        <SelectItem value="PAY">PayPal</SelectItem>
                        <SelectItem value="AUT">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4 sm:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  router.back();
                }}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isSubmitting || (mode_paiement === "PER" && !methode_paiement)}
              >
                {montant > 0
                  ? `Enregistrer le paiement de ${montant} CHF`
                  : "Enregistrer le paiement"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}
