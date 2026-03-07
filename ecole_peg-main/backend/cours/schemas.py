from typing import Optional, List
from ninja import Schema
from datetime import date, time

# ------------------- COURS -------------------
class CoursOut(Schema):
    id: int
    nom: str
    type_cours: str
    niveau: str
    heures_par_semaine: Optional[int] = None
    duree_semaines: Optional[int] = None
    tarif: float


class CoursIn(Schema):
    nom: str
    type_cours: str
    niveau: str
    heures_par_semaine: Optional[int] = None
    duree_semaines: Optional[int] = None
    tarif: float


# ------------------- ENSEIGNANT -------------------
class EnseignantOut(Schema):
    id: int
    nom: str
    prenom: str


class EnseignantIn(Schema):
    nom: str
    prenom: str


# ------------------- SESSION -------------------
class SessionIn(Schema):
    id_cours: int
    id_enseignant: int
    date_debut: date
    date_fin: date
    periode_journee: str
    capacite_max: int
    seances_mois: int


class SessionOut(Schema):
    id: int
    id_cours: int
    id_enseignant: Optional[int] = None
    enseignant__nom: Optional[str] = None
    enseignant__prenom: Optional[str] = None
    cours__nom: str
    cours__type_cours: str
    cours__niveau: str
    date_debut: date
    date_fin: date
    periode_journee: Optional[str] = None
    statut: str
    capacite_max: int
    seances_mois: int

    #----------------------SALLE----------------------

    class sallein(Schema):
        nom: str
        capacite: int


    class salleout(Schema):
        id: int
        nom: str
        capacite: int

# ------------------- COURS PRIVES -------------------
class CoursPriveIn(Schema):
    date_cours_prive: date
    heure_debut: time
    heure_fin: time
    tarif: float
    lieu: str
    eleves_ids: List[int]
    enseignant: int



class CoursPriveOut(Schema):
    id: int
    date_cours_prive: date
    heure_debut: time
    heure_fin: time
    tarif: float
    lieu: str
    enseignant: int
    enseignant__nom: str
    enseignant__prenom: str
    eleves: List[str] = []
    eleves_ids: List[int] = []


# ------------------- INSCRIPTION -------------------
class InscriptionIn(Schema):
    but: Optional[str] = None
    preinscription: Optional[bool] = None
    id_session: int


class InscriptionOut(Schema):
    id: int
    date_inscription: date
    but: str
    statut: str
    date_sortie: Optional[date] = None
    motif_sortie: Optional[str] = None
    preinscription: bool
    id_session: int


class InscriptionUpdateIn(Schema):
    but: Optional[str] = None
    date_sortie: Optional[date] = None
    motif_sortie: Optional[str] = None
    preinscription: Optional[bool] = None
    # ❌ id_session retiré (on ne veut plus qu’il soit modifié)


class FichePresencesIn(Schema):
    mois: str
    annee: int


class FichesPresencesOut(Schema):
    id: int
    mois: str
    annee: int


class PresenceIn(Schema):
    id: int
    statut: str


class PresenceOut(Schema):
    id: int
    id_eleve: int
    date_presence: date
    statut: str


class FichePresencesOut(Schema):
    id: int
    mois: str
    annee: int
    presences: List[PresenceOut]
