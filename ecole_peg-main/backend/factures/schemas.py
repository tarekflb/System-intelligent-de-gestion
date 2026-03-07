from datetime import date
from typing import Optional, List
from ninja import Schema

# ------------------- DÉTAIL DE FACTURE -------------------

class DetailFactureIn(Schema):
    description: str
    date_debut_periode: Optional[date] = None
    date_fin_periode: Optional[date] = None
    montant: float


class DetailFactureOut(Schema):
    id: int
    description: str
    date_debut_periode: Optional[date] = None
    date_fin_periode: Optional[date] = None
    montant: float


# ------------------- FACTURE -------------------

class FactureIn(Schema):
    id_inscription: Optional[int] = None
    id_cours_prive: Optional[int] = None
    id_eleve: Optional[int] = None
    details_facture: List[DetailFactureIn]


class FacturesOut(Schema):
    id: int
    date_emission: date
    montant_total: float
    montant_restant: float


class FactureOut(Schema):
    id: int
    date_echeance: Optional[date] = None
    date_emission: date
    montant_total: float
    montant_restant: float
    eleve_nom: str
    eleve_prenom: str
    eleve_rue: Optional[str] = None
    eleve_numero: Optional[str] = None
    eleve_npa: Optional[str] = None
    eleve_localite: Optional[str] = None


class EcheanceIn(Schema):
    date_echeance: Optional[date] = None

# ------------------- PAIEMENT -------------------

class PaiementIn(Schema):
    montant: float
    mode_paiement: str
    methode_paiement: Optional[str] = None
    id_facture: int


class PaiementOut(Schema):
    id: int
    date_paiement: date
    montant: float
    mode_paiement: str
    methode_paiement: Optional[str] = None

class PaiementWithEleveOut(PaiementOut):
    eleve_nom: Optional[str] = None
    eleve_prenom: Optional[str] = None
