import calendar
from datetime import date, timedelta
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.db import models
from ninja import Router
from ninja.errors import HttpError
from .models import (
    Cours,
    Enseignant,
    Presence,
    Session,
    CoursPrive,
    Inscription,
    FichePresences,
    StatutPresenceChoices,
    StatutInscriptionChoices,  # <-- Add this import
)
from eleves.models import Eleve
from eleves.schemas import ElevesOut
from django.db.models import Q
from .schemas import (
    CoursIn,
    CoursOut,
    EnseignantIn,
    EnseignantOut,
    FichePresencesOut,
    FichesPresencesOut,
    PresenceIn,
    SessionIn,
    SessionOut,
    CoursPriveIn,
    CoursPriveOut,
    InscriptionIn,
    InscriptionUpdateIn,
    FichePresencesIn,
    InscriptionOut, 
    salleout,
    sallein

 # Added import for InscriptionOut
)
from django.db import transaction
from django.core.paginator import Paginator
from typing import Optional, List

router = Router()

# ------------------- COURS -------------------


@router.get("/cours/")
def get_cours(request):
    cours = Cours.objects.all()
    return [CoursOut.from_orm(c) for c in cours]


@router.get("/cours/{cours_id}/")
def get_cours_specifique(request, cours_id: int):
    cours = get_object_or_404(Cours, id=cours_id)
    return CoursOut.from_orm(cours)


@router.post("/cour/")
def create_cours(request, cours: CoursIn):
    try:
        with transaction.atomic():
            cours_obj = Cours(**cours.dict())
            cours_obj.full_clean()
            cours_obj.save()
            return {"id": cours_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.put("/cours/{cours_id}/")
def update_cours(request, cours_id: int, cours: CoursIn):
    try:
        with transaction.atomic():
            cours_obj = get_object_or_404(Cours, id=cours_id)
            for attr, value in cours.dict().items():
                setattr(cours_obj, attr, value)
            cours_obj.full_clean()
            cours_obj.save()
            return {"id": cours_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.delete("/cours/{cours_id}/")
def delete_cours(request, cours_id: int):
    with transaction.atomic():
        cours = get_object_or_404(Cours, id=cours_id)
        cours.delete()


# ------------------- ENSEIGNANT -------------------
@router.get("/enseignants/")
def list_enseignants(request, search: Optional[str] = None):
    enseignants = Enseignant.objects.all()
    if search:
        enseignants = enseignants.filter(
            Q(nom__icontains=search) | Q(prenom__icontains=search)
        )
    return [EnseignantOut.from_orm(e) for e in enseignants]


@router.post("/enseignant/")
def create_enseignant(request, enseignant: EnseignantIn):
    try:
        with transaction.atomic():
            enseignant_obj = Enseignant(**enseignant.dict())
            enseignant_obj.full_clean()
            enseignant_obj.save()
            return {"id": enseignant_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.put("/enseignants/{enseignant_id}/")
def update_enseignant(request, enseignant_id: int, enseignant: EnseignantIn):
    try:
        with transaction.atomic():
            enseignant_obj = get_object_or_404(Enseignant, id=enseignant_id)
            for attr, value in enseignant.dict().items():
                setattr(enseignant_obj, attr, value)
            enseignant_obj.full_clean()
            enseignant_obj.save()
            return {"id": enseignant_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.delete("/enseignants/{enseignant_id}/")
def delete_enseignant(request, enseignant_id: int):
    with transaction.atomic():
        enseignant = get_object_or_404(Enseignant, id=enseignant_id)
        enseignant.delete()


# ------------------- SESSION -------------------
@router.get("/sessions/")
def sessions(
    request,
    page: int = 1,
    taille: int = 10,
    type: Optional[str] = None,
    niveau: Optional[str] = None,
    statut: Optional[str] = None,
):
    sessions_qs = (
        Session.objects.select_related("cours", "enseignant")
        .annotate(
            id_cours=models.F("cours_id"),
            id_enseignant=models.F("enseignant_id"),
            enseignant__nom=models.F("enseignant__nom"),
            enseignant__prenom=models.F("enseignant__prenom"),
            cours__nom=models.F("cours__nom"),
            cours__type_cours=models.F("cours__type_cours"),
            cours__niveau=models.F("cours__niveau"),
        )
        .order_by("date_debut")
    )

    if type and type != "tous":
        sessions_qs = sessions_qs.filter(cours__type_cours=type)
    if niveau and niveau != "tous":
        sessions_qs = sessions_qs.filter(cours__niveau=niveau)
    if statut and statut != "tous":
        sessions_qs = sessions_qs.filter(statut=statut)

    paginator = Paginator(sessions_qs, taille)
    page_obj = paginator.get_page(page)

    return {
        "sessions": [SessionOut.from_orm(s) for s in page_obj.object_list],
        "nombre_total": paginator.count,
    }


@router.get("/sessions/{id_session}/", response=SessionOut)
def rechercher_session(request, id_session: int):
    session = get_object_or_404(
        Session.objects.select_related("cours", "enseignant").annotate(
            cours__nom=models.F("cours__nom"),
            cours__type_cours=models.F("cours__type_cours"),
            cours__niveau=models.F("cours__niveau"),
            id_cours=models.F("cours__id"),
            id_enseignant=models.F("enseignant__id"),
            enseignant__nom=models.F("enseignant__nom"),
            enseignant__prenom=models.F("enseignant__prenom"),
        ),
        id=id_session,
    )
    return SessionOut.from_orm(session)


@router.post("/session/")
def create_session(request, session: SessionIn):
    try:
        with transaction.atomic():
            cours = get_object_or_404(Cours, id=session.id_cours)
            enseignant = (
                get_object_or_404(Enseignant, id=session.id_enseignant)
                if session.id_enseignant
                else None
            )

            session_obj = Session.objects.create(
                cours=cours,
                date_debut=session.date_debut,
                date_fin=session.date_fin,
                periode_journee=session.periode_journee,
                capacite_max=session.capacite_max,
                enseignant=enseignant,
                seances_mois=session.seances_mois,
            )
            session_obj.full_clean()
            return {"id": session_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.put("/sessions/{id_session}/")
def update_session(request, id_session: int, session: SessionIn):
    try:
        with transaction.atomic():
            session_obj = get_object_or_404(
                Session.objects.select_related("cours", "enseignant"), id=id_session
            )
            session_obj.cours = get_object_or_404(Cours, id=session.id_cours)
            if session.id_enseignant:
                session_obj.enseignant = get_object_or_404(
                    Enseignant, id=session.id_enseignant
                )
            for attr, value in session.dict(
                exclude={"id_cours", "id_enseignant"}
            ).items():
                setattr(session_obj, attr, value)
            session_obj.full_clean()
            session_obj.save()
            return {"id": session_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.delete("/sessions/{id_session}/")
def delete_session(request, id_session: int):
    with transaction.atomic():
        session = get_object_or_404(Session, id=id_session)
        session.delete()


# ------------------- COURS PRIVE -------------------
@router.get("/cours_prive/")
def list_cours_prive(request, page: int = 1, taille: int = 10):
    cours_prives_qs = (
        CoursPrive.objects.select_related("enseignant")
        .prefetch_related("eleves")
        .annotate(
            enseignant__nom=models.F("enseignant__nom"),
            enseignant__prenom=models.F("enseignant__prenom"),
        )
    )
    paginator = Paginator(cours_prives_qs, taille)
    page_obj = paginator.get_page(page)
    return {
        "cours_prives": [
            CoursPriveOut(
                id=cours_prive.id,
                date_cours_prive=cours_prive.date_cours_prive,
                heure_debut=cours_prive.heure_debut,
                heure_fin=cours_prive.heure_fin,
                tarif=cours_prive.tarif,
                lieu=cours_prive.lieu,
                enseignant=cours_prive.enseignant.id,
                enseignant__nom=cours_prive.enseignant.nom,
                enseignant__prenom=cours_prive.enseignant.prenom,
                eleves=[
                    f"{eleve.nom} {eleve.prenom}" for eleve in cours_prive.eleves.all()
                ],
                eleves_ids=[eleve.id for eleve in cours_prive.eleves.all()],
            )
            for cours_prive in page_obj.object_list
        ],
        "nombre_total": paginator.count,
    }


@router.get("/cours_prive/{cours_prive_id}/", response=CoursPriveOut)
def get_cours_prive(request, cours_prive_id: int):
    cours_prive = get_object_or_404(
        CoursPrive.objects.select_related("enseignant").prefetch_related("eleves"),
        id=cours_prive_id,
    )
    return CoursPriveOut(
        id=cours_prive.id,
        date_cours_prive=cours_prive.date_cours_prive,
        heure_debut=cours_prive.heure_debut,
        heure_fin=cours_prive.heure_fin,
        tarif=cours_prive.tarif,
        lieu=cours_prive.lieu,
        enseignant=cours_prive.enseignant.id,
        enseignant__nom=cours_prive.enseignant.nom,
        enseignant__prenom=cours_prive.enseignant.prenom,
        eleves=[f"{eleve.nom} {eleve.prenom}" for eleve in cours_prive.eleves.all()],
        eleves_ids=[eleve.id for eleve in cours_prive.eleves.all()],
    )


@router.get("/eleves/{eleve_id}/cours_prives/", response=list[CoursPriveOut])
def get_cours_prives_by_eleve(request, eleve_id: int):
    eleve = get_object_or_404(Eleve, id=eleve_id)
    cours_prives = eleve.cours_prives.select_related("enseignant").all()
    return [
        CoursPriveOut(
            id=cours_prive.id,
            date_cours_prive=cours_prive.date_cours_prive,
            heure_debut=cours_prive.heure_debut,
            heure_fin=cours_prive.heure_fin,
            tarif=cours_prive.tarif,
            lieu=cours_prive.lieu,
            enseignant=cours_prive.enseignant.id,
            enseignant__nom=cours_prive.enseignant.nom,
            enseignant__prenom=cours_prive.enseignant.prenom,
            eleves=[
                f"{eleve.nom} {eleve.prenom}" for eleve in cours_prive.eleves.all()
            ],
            eleves_ids=[eleve.id for eleve in cours_prive.eleves.all()],
        )
        for cours_prive in cours_prives
    ]


@router.post("/cours_prive/")
def create_cours_prive(request, cours_prive: CoursPriveIn):
    try:
        with transaction.atomic():
            eleves = Eleve.objects.filter(id__in=cours_prive.eleves_ids)
            if len(eleves) != len(cours_prive.eleves_ids):
                return {"detail": "IDs d'élèves invalides"}

            enseignant = get_object_or_404(Enseignant, id=cours_prive.enseignant)
            cours_prive_obj = CoursPrive.objects.create(
                date_cours_prive=cours_prive.date_cours_prive,
                heure_debut=cours_prive.heure_debut,
                heure_fin=cours_prive.heure_fin,
                tarif=cours_prive.tarif,
                lieu=cours_prive.lieu,
                enseignant=enseignant,
            )
            cours_prive_obj.eleves.set(eleves)
            cours_prive_obj.full_clean()
        return {"id": cours_prive_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.put("/cours_prive/{cours_prive_id}/")
def update_cours_prive(request, cours_prive_id: int, cours_prive: CoursPriveIn):
    try:
        with transaction.atomic():
            cours_prive_obj = get_object_or_404(CoursPrive, id=cours_prive_id)
            eleves = Eleve.objects.filter(id__in=cours_prive.eleves_ids)
            if len(eleves) != len(cours_prive.eleves_ids):
                return {"detail": "IDs d'élèves invalides"}
            cours_prive_obj.eleves.set(eleves)

            enseignant = get_object_or_404(Enseignant, id=cours_prive.enseignant)
            cours_prive_obj.enseignant = enseignant

            for attr, value in cours_prive.dict(
                exclude={"eleves_ids", "enseignant"}
            ).items():
                setattr(cours_prive_obj, attr, value)

            cours_prive_obj.full_clean()
            cours_prive_obj.save()
        return {"id": cours_prive_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.delete("/cours_prive/{cours_prive_id}/")
def delete_cours_prive(request, cours_prive_id: int):
    with transaction.atomic():
        cours_prive = get_object_or_404(CoursPrive, id=cours_prive_id)
        cours_prive.delete()


# ------------------- INSCRIPTIONS -------------------
@router.get("/{eleve_id}/inscriptions/{inscription_id}/")
def get_inscription(request, eleve_id: int, inscription_id: int):
    inscription = get_object_or_404(
        Inscription.objects.select_related("session", "eleve"),
        id=inscription_id,
        eleve_id=eleve_id,
    )
    return {
        "id": inscription.id,
        "date_inscription": inscription.date_inscription,
        "but": inscription.but,
        "statut": inscription.statut,
        "date_sortie": inscription.date_sortie,
        "motif_sortie": inscription.motif_sortie,
        "preinscription": inscription.preinscription,
        "id_session": inscription.session.id,
    }


@router.get("/{eleve_id}/inscriptions/")
def get_inscriptions_by_eleve(request, eleve_id: int):
    inscriptions = Inscription.objects.select_related("session", "eleve").filter(
        eleve_id=eleve_id
    )
    return [
        {
            "id": inscription.id,
            "date_inscription": inscription.date_inscription,
            "but": inscription.but,
            "statut": inscription.statut,
            "date_sortie": inscription.date_sortie,
            "motif_sortie": inscription.motif_sortie,
            "preinscription": inscription.preinscription,
            "id_session": inscription.session.id,
        }
        for inscription in inscriptions
    ]


@router.post("/{eleve_id}/inscription/")
def create_inscription(request, eleve_id: int, inscription: InscriptionIn):
    try:
        with transaction.atomic():
            eleve = get_object_or_404(Eleve, id=eleve_id)
            session = get_object_or_404(Session, id=inscription.id_session)
            if session.inscriptions.count() >= session.capacite_max:
                return {"detail": "Session complète"}
            session = Session.objects.select_for_update().get(id=inscription.id_session)

            inscription_obj, created = Inscription.objects.get_or_create(
                eleve=eleve,
                session=session,
                defaults=inscription.dict(exclude={"id_session"}),
            )

            if not created:
                return {"detail": "Inscription déjà existante"}

            return {"id": inscription_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}
    

@router.put("/inscriptions/{inscription_id}/", response=InscriptionOut)
def update_inscription(request, inscription_id: int, inscription: InscriptionUpdateIn):
    """
    Met à jour une inscription existante sans changer la session.
    Le statut est automatiquement défini selon la date de fin de la session.
    """
    try:
        inscription_obj = Inscription.objects.get(id=inscription_id)
    except Inscription.DoesNotExist:
        raise HttpError(404, "Inscription non trouvée")

    # 🔹 Mise à jour des champs modifiables
    for field, value in inscription.dict(exclude_unset=True).items():
        if value is not None:
            setattr(inscription_obj, field, value)

    # 🔹 Garder la session actuelle
    session = inscription_obj.session

    # 🔹 Déterminer le statut automatiquement
    date_inscription = inscription_obj.date_inscription or date.today()
    if session.date_fin and date_inscription <= session.date_fin:
        inscription_obj.statut = StatutInscriptionChoices.ACTIF
    else:
        inscription_obj.statut = StatutInscriptionChoices.INACTIF

    print("DEBUG avant clean:", inscription_obj.id, inscription_obj.statut, inscription_obj.session_id)

    try:
        inscription_obj.full_clean()
        # 🔒 Protection anti-null
        if not inscription_obj.statut:
            inscription_obj.statut = StatutInscriptionChoices.ACTIF

        print("DEBUG avant save:", inscription_obj.statut)
        inscription_obj.save()
    except Exception as e:
        print("ERREUR:", str(e))
        raise HttpError(400, f"Erreur de validation : {str(e)}")

    return InscriptionOut(
        id=inscription_obj.id,
        id_session=session.id,
        date_inscription=inscription_obj.date_inscription,
        statut=inscription_obj.statut,
        preinscription=inscription_obj.preinscription,
        but=inscription_obj.but,
        date_sortie=inscription_obj.date_sortie,
        motif_sortie=inscription_obj.motif_sortie,
    )



@router.delete("/{eleve_id}/inscriptions/{inscription_id}/")
def delete_inscription(request, eleve_id: int, inscription_id: int):
    with transaction.atomic():
        inscription = get_object_or_404(
            Inscription, id=inscription_id, eleve_id=eleve_id
        )
        inscription.delete()


@router.get("/eleves/preinscrits")
def get_eleves_preinscrits(request, page: int = 1, taille: int = 10):
    eleves_preinscrits = Eleve.objects.filter(
        inscriptions__preinscription=True
    ).distinct()
    paginator = Paginator(eleves_preinscrits, taille)
    page_obj = paginator.get_page(page)
    return {
        "eleves": [ElevesOut.from_orm(e) for e in page_obj.object_list],
        "nombre_total": paginator.count,
    }


@router.get("/session/{id_session}/eleves/")
def eleves_session(request, id_session: int):
    inscriptions = get_object_or_404(
        Session, id=id_session
    ).inscriptions.select_related("eleve")

    return [
        {
            "id": inscription.eleve.id,
            "nom": inscription.eleve.nom,
            "prenom": inscription.eleve.prenom,
        }
        for inscription in inscriptions
    ]


@router.post("/session/{id_session}/fiche_presences/")
def creer_fiche_presences(request, id_session: int, payload: FichePresencesIn):
    session = get_object_or_404(Session, id=id_session)

    try:
        with transaction.atomic():
            fiche = FichePresences(
                session=session,
                **payload.dict(),
            )
            fiche.full_clean()
            fiche.save()

            mois = int(payload.mois)

            premier_du_mois = date(payload.annee, mois, 1)
            dernier_jour = calendar.monthrange(payload.annee, mois)[1]
            dernier_du_mois = date(payload.annee, mois, dernier_jour)

            dates = []

            actuel = premier_du_mois

            while actuel <= dernier_du_mois:
                dates.append(actuel)
                actuel += timedelta(days=1)

            inscriptions = Inscription.objects.filter(session=session).select_related(
                "eleve"
            )

            presences_a_creer = []

            for ins in inscriptions:
                eleve = ins.eleve

                for d in dates:
                    presences_a_creer.append(
                        Presence(
                            fiche_presences=fiche,
                            eleve=eleve,
                            date_presence=d,
                            statut=StatutPresenceChoices.ABSENT,
                        )
                    )

            Presence.objects.bulk_create(presences_a_creer, ignore_conflicts=True)

        return {"id": fiche.id}
    except Exception as e:
        return {"message": "Erreur lors de la création", "detail": str(e)}


@router.get("/session/{id_session}/fiches_presences/")
def fiches_presences_session(request, id_session: int):
    session = get_object_or_404(Session, id=id_session)

    return [
        FichesPresencesOut.from_orm(fiche)
        for fiche in FichePresences.objects.filter(session=session)
    ]


@router.get(
    "/fiche_presences/{id_fiche_presences}/",
    response=FichePresencesOut,
)
def get_fiche_presences(request, id_fiche_presences: int):
    fiche = get_object_or_404(FichePresences, id=id_fiche_presences)

    liste_presences = [
        {
            "id": presence.id,
            "id_eleve": presence.eleve.id,
            "date_presence": presence.date_presence,
            "statut": presence.statut,
        }
        for presence in fiche.presences.select_related("eleve").all()
    ]

    return {
        "id": fiche.id,
        "mois": fiche.mois,
        "annee": fiche.annee,
        "presences": liste_presences,
    }


@router.delete("/fiche_presences/{id_fiche_presences}/")
def supprimer_fiche_presences(request, id_fiche_presences: int):
    with transaction.atomic():
        get_object_or_404(FichePresences, id=id_fiche_presences).delete()


@router.put("/fiche_presences/{id_fiche_presences}/")
def modifier_fiche_presences(
    request, id_fiche_presences: int, payload: list[PresenceIn]
):
    fiche = get_object_or_404(FichePresences, id=id_fiche_presences)

    ids_presences = [presence.id for presence in payload]

    qs = Presence.objects.filter(fiche_presences=fiche, id__in=ids_presences)

    map_presences = {presence.id: presence for presence in qs}

    a_modifier = []

    for entree in payload:
        presence = map_presences.get(entree.id)

        if not presence:
            raise Http404(f"Présence {entree.id} not found in fiche {fiche.id}")

        presence.statut = entree.statut
        presence.full_clean()

        a_modifier.append(presence)

    with transaction.atomic():
        if a_modifier:
            Presence.objects.bulk_update(a_modifier, ["statut"])

    return {"success": True}
