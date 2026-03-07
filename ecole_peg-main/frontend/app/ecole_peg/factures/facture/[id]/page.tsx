/* eslint-disable @next/next/no-img-element */
"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/button";
import { Card, CardContent, CardFooter } from "@/components/card";
import { ArrowLeft, Download, Trash2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";

type Html2CanvasOptions = Parameters<typeof html2canvas>[1];

interface Facture {
  id: number;
  date_emission: Date;
  date_echeance?: Date | null; // 👈 nouveau
  montant_total: number;
  eleve_nom: string;
  eleve_prenom: string;
  // Adresse (si exposée par l'API)
  eleve_rue?: string | null;
  eleve_numero?: string | null;
  eleve_npa?: string | null;
  eleve_localite?: string | null;
}

interface DetailFacture {
  id: number;
  description: string;
  date_debut_periode: Date | undefined;
  date_fin_periode: Date | undefined;
  montant: number;
}

export default function FacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);

  const [facture, setFacture] = useState<Facture>();
  const [details_facture, setDetailsFacture] = useState<DetailFacture[]>([]);

  // 👇 état & helpers pour l’édition de l’échéance
  const [editEcheance, setEditEcheance] = useState(false);
  const [echeanceInput, setEcheanceInput] = useState<string>("");

  function toInputDate(d?: Date | string | null): string {
    if (!d) return "";
    const dt = new Date(d as string | number | Date);
    if (Number.isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function openEditEcheance() {
    setEcheanceInput(toInputDate(facture?.date_echeance ?? null));
    setEditEcheance(true);
  }

  async function saveEcheance() {
    try {
      await api.patch(`/factures/facture/${resolvedParams.id}/echeance/`, {
        date_echeance: echeanceInput || null, // "YYYY-MM-DD" ou null pour effacer
      });
      const r = await api.get<Facture>(`/factures/facture/${resolvedParams.id}/`);
      setFacture(r.data);
      setEditEcheance(false);
    } catch (err) {
      console.error("Erreur maj échéance:", err);
      alert("Impossible d’enregistrer l’échéance.");
    }
  }

  async function clearEcheance() {
    setEcheanceInput("");
    await saveEcheance();
  }

  const factureRef = useRef<HTMLDivElement>(null);

  const handleTelechargerPdf = async () => {
    if (!factureRef.current) return;

    const canvas = await html2canvas(factureRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
    } as Html2CanvasOptions);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const pxToMm = pageWidth / canvas.width;
    let imgWidthMm = canvas.width * pxToMm;
    let imgHeightMm = canvas.height * pxToMm;

    if (imgHeightMm > pageHeight) {
      const mmPerPxH = pageHeight / canvas.height;
      const altWidth = canvas.width * mmPerPxH;
      const altHeight = pageHeight;

      imgWidthMm = altWidth;
      imgHeightMm = altHeight;
    }

    const x = (pageWidth - imgWidthMm) / 2;
    const y = (pageHeight - imgHeightMm) / 2;

    pdf.addImage(imgData, "PNG", x, y, imgWidthMm, imgHeightMm);
    pdf.save(`facture_${facture?.id ?? "ecole"}.pdf`);
  };

  async function supprimerFacture() {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      return;
    }
    try {
      await api.delete(`/factures/facture/${resolvedParams.id}/`);
      router.push("/ecole_peg/factures/");
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Une erreur est survenue lors de la suppression de la facture.");
    }
  }

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

    async function fetchDetailsFacture() {
      try {
        const reponse = await api.get<DetailFacture[]>(
          `/factures/facture/${resolvedParams.id}/details/`
        );
        setDetailsFacture(reponse.data);
      } catch (err) {
        console.error("Erreur: ", err);
      }
    }

    fetchFacture();
    fetchDetailsFacture();
  }, [resolvedParams.id]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/ecole_peg/factures/")}
            aria-label="Retourner à la page précédente"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Facture {facture?.id}
            </h1>
            <p className="text-muted-foreground">
              {facture?.date_emission ? formatDate(facture?.date_emission) : "-"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTelechargerPdf}
            className="shadow-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>

          {/* 👇 nouveau bouton Échéance */}
          <Button
            variant="secondary"
            onClick={openEditEcheance}
            className="shadow-sm"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Échéance
          </Button>

          <Button
            variant="destructive"
            onClick={supprimerFacture}
            className="shadow-sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* 👇 mini formulaire d'édition d'échéance */}
      {editEcheance && (
        <div className="border rounded-lg p-4 bg-muted/30 flex flex-wrap items-center gap-3">
          <label className="text-sm">Nouvelle date d&apos;échéance :</label>
          <input
            type="date"
            value={echeanceInput}
            onChange={(e) => setEcheanceInput(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm bg-background"
          />
          <Button onClick={saveEcheance} className="shadow-sm">
            Enregistrer
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditEcheance(false)}
            className="shadow-sm"
          >
            Annuler
          </Button>
          {facture?.date_echeance && (
            <Button
              variant="ghost"
              onClick={clearEcheance}
              className="text-red-600"
            >
              Effacer l&apos;échéance
            </Button>
          )}
        </div>
      )}

      <div
        ref={factureRef}
        className="bg-background rounded-xl shadow-md print:shadow-none mx-auto"
        style={{
          width: "210mm",
          height: "297mm",
          backgroundColor: "var(--background)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Card className="border-none flex-1 flex flex-col h-full">
          <CardContent className="p-8 space-y-8 flex-1">
            <div className="flex flex-col md:flex-row md:justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <img
                    src="/logo/ecole_peg.png"
                    alt="École PEG"
                    width={150}
                    height={75}
                    style={{ objectFit: "contain" }}
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Rue du Nant 34</p>
                  <p>1207 Genève</p>
                  <p>Téléphone : 022 700 45 35</p>
                  <p>Email : info@ecole-peg.ch</p>
                  <p>www.ecole-peg.ch</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-4">
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-primary mb-2">Facture</h2>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">N° de facture :</span>{" "}
                      <span className="font-medium">{facture?.id}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Date d&apos;émission :</span>{" "}
                      <span className="font-medium">
                        {facture?.date_emission ? formatDate(facture?.date_emission) : "-"}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Échéance :</span>{" "}
                      <span className="font-medium">
                        {facture?.date_echeance
                          ? formatDate(facture.date_echeance)
                          : "À réception"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Facturé à
              </h3>
              <p className="text-lg font-semibold">
                {facture?.eleve_nom} {facture?.eleve_prenom}
              </p>

              {(facture?.eleve_rue || facture?.eleve_numero) && (
                <p className="text-sm text-muted-foreground">
                  {[facture?.eleve_rue, facture?.eleve_numero].filter(Boolean).join(" ")}
                </p>
              )}
              {(facture?.eleve_npa || facture?.eleve_localite) && (
                <p className="text-sm text-muted-foreground">
                  {[facture?.eleve_npa, facture?.eleve_localite].filter(Boolean).join(" ")}
                </p>
              )}
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Description
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Période
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Montant
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {details_facture.map((detail) => (
                    <TableRow key={detail.id} className="hover:bg-muted/30">
                      <TableCell className="px-4 py-3">{detail.description}</TableCell>
                      <TableCell className="px-4 py-3">
                        {detail.date_debut_periode && (
                          <>
                            Du {formatDate(detail.date_debut_periode)}
                            {detail.date_fin_periode && <> au {formatDate(detail.date_fin_periode)}</>}
                          </>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-medium">
                        {detail.montant.toFixed(2)} CHF
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={2} className="px-4 py-4 text-right font-bold">
                      Total
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right font-bold text-primary">
                      {facture?.montant_total.toFixed(2)} CHF
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg border bg-muted/30 p-6 space-y-4">
              <h3 className="font-semibold text-primary">Coordonnées bancaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <div className="text-muted-foreground">Titulaire</div>
                    <div className="font-medium">Ecole P.E.G SARL</div>
                    <div className="text-muted-foreground">Compte</div>
                    <div className="font-medium">240-288885.00ZP</div>
                    <div className="text-muted-foreground">IBAN</div>
                    <div className="font-medium">CH55 0024 0240 2888 8500 Z</div>
                    <div className="text-muted-foreground">BIC / SWIFT</div>
                    <div className="font-medium">UBS W CH ZH 80A</div>
                  </div>
                </div>
                <div className="flex justify-center md:justify-end">
                  <img
                    src="/QR.png"
                    alt="QR Code pour paiement"
                    width={120}
                    height={80}
                    style={{ objectFit: "contain" }}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-between border-t px-8 py-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">Veuillez indiquer votre nom sur le mode de paiement</p>
            <p className="text-sm text-muted-foreground">Merci de votre confiance.</p>
          </CardFooter>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8 shadow-sm transition-all duration-200 hover:shadow-md"
          onClick={() =>
            router.push(`/ecole_peg/factures/facture/${resolvedParams.id}/payer`)
          }
        >
          Procéder au paiement
        </Button>
      </div>
    </div>
  );
}
