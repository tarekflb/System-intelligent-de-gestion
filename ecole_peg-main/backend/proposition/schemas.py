from datetime import date
from datetime import time as heure
from typing import List, Optional  
from ninja import Schema
from datetime import timedelta, time as minutes

class propositonin(Schema):
    date_coursprive : Optional[date] = None
    dureecours: Optional[timedelta]= None
    nb_eleves : int 
    niveau :str
     
class propositionout(Schema):
    id: int
    salle : int
    peridode_journee : str
    date_coursprive: Optional[date]=None
    niveau: str
    heure_debut: Optional[heure] = None
    heure_fin: Optional[heure] =None
    tarif: float
    enseignant: int
    enseignant__nom: str
    enseignant__prenom: str
    eleves: List[str] = []
    eleves_ids: List[int] = []


 