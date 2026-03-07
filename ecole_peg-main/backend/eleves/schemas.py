from datetime import date
from typing import Optional
from ninja import Schema, UploadedFile, File

# ------------------- GARANT -------------------
class GarantIn(Schema):
    nom: str
    prenom: str
    rue: Optional[str] = None
    numero: Optional[str] = None
    npa: Optional[str] = None
    localite: Optional[str] = None
    telephone: str
    email: str


class GarantOut(Schema):
    id: int
    nom: str
    prenom: str
    rue: Optional[str] = None
    numero: Optional[str] = None
    npa: Optional[str] = None
    localite: Optional[str] = None
    telephone: str
    email: str


# ------------------- PAYS -------------------
class PaysOut(Schema):
    id: int
    nom: str
    indicatif: str


# ------------------- TEST -------------------
class TestIn(Schema):
    date_test: date
    niveau: str
    note: float


class TestOut(Schema):
    id: int
    date_test: date
    niveau: str
    note: float


# ------------------- DOCUMENT -------------------
class DocumentOut(Schema):
    id: int
    nom: str
    fichier_url: str
    date_ajout: date

    @classmethod
    def from_model(cls, document, request) -> "DocumentOut":
        return cls(
            id=document.id,
            nom=document.nom,
            fichier_url=request.build_absolute_uri(document.fichier.url),
            date_ajout=document.date_ajout,
        )


class DocumentUpdateIn(Schema):
    nom: Optional[str] = None
    fichier: Optional[UploadedFile] = File(None)


# ------------------- ELEVE -------------------
class EleveIn(Schema):
    nom: str
    prenom: str
    date_naissance: date
    lieu_naissance: Optional[str] = None
    sexe: str
    rue: Optional[str] = None
    numero: Optional[str] = None
    npa: Optional[str] = None
    localite: Optional[str] = None
    telephone: str
    email: str
    adresse_facturation: Optional[str] = None
    type_permis: Optional[str] = None
    date_permis: Optional[date] = None
    niveau: Optional[str] = None
    langue_maternelle: Optional[str] = None
    autres_langues: Optional[str] = None
    src_decouverte: Optional[str] = None
    commentaires: Optional[str] = None
    pays_id: int


class ElevesOut(Schema):
    id: int
    nom: str
    prenom: str
    date_naissance: date
    telephone: str
    email: str
    pays__nom: str


class EleveOut(Schema, from_attributes=True):
    id: int
    nom: str
    prenom: str
    date_naissance: date
    lieu_naissance: Optional[str] = None
    sexe: str
    rue: Optional[str] = None
    numero: Optional[str] = None
    npa: Optional[str] = None
    localite: Optional[str] = None
    telephone: str
    email: str
    adresse_facturation: Optional[str] = None
    type_permis: Optional[str] = None
    date_permis: Optional[date] = None
    niveau: Optional[str] = None
    langue_maternelle: Optional[str] = None
    autres_langues: Optional[str] = None
    src_decouverte: Optional[str] = None
    commentaires: Optional[str] = None
    pays_id: int
    pays__nom: str


class Anniversaire(Schema):
    id: int
    nom: str
    prenom: str
    date_naissance: date
    age: int
