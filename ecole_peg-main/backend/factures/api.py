from django.shortcuts import get_object_or_404
from django.db import transaction, models
from django.core.exceptions import ValidationError
from ninja import Router
from ninja.errors import HttpError
from typing import Optional
from datetime import date
from .models import Facture, DetailFacture, Paiement
from cours.models import Inscription, CoursPrive
from eleves.models import Eleve
from .schemas import (
    FactureIn,
    FacturesOut,
    FactureOut,
    PaiementIn,
    PaiementOut,
    DetailFactureOut,
    EcheanceIn,
    PaiementWithEleveOut,  # 👈 Ajouté pour corriger l'erreur
)
from django.core.paginator import Paginator

router = Router()


# ------------------- FACTURES -------------------


@router.get("/factures/", response=dict)
def factures(
    request,
    page: int = 1,
    taille: int = 10,
):
    """
    Liste toutes les factures, paginées.
    """
    qs = Facture.objects.select_related("eleve", "inscription__eleve").prefetch_related(
        "details", "paiements"
    )

    paginator = Paginator(qs, taille)
    page_obj = paginator.get_page(page)

    return {
        "factures": [
            FactureOut(
                id=f.id,
                date_emission=f.date_emission,
                montant_total=float(f.montant_total),
                montant_restant=float(f.montant_restant),
                eleve_nom=f.eleve.nom if f.eleve else f.inscription.eleve.nom,
                eleve_prenom=f.eleve.prenom if f.eleve else f.inscription.eleve.prenom,
            )
            for f in page_obj.object_list
        ],
        "nombre_total": paginator.count,
    }


@router.get("/factures/payees/", response=dict)
def get_factures_payees(
    request,
    page: int = 1,
    taille: int = 10,
):
    """
    Liste les factures entièrement payées (montant_restant = 0).
    """
    qs = Facture.objects.select_related("eleve", "inscription__eleve").prefetch_related(
        "details", "paiements"
    )

    factures_soldees = [f for f in qs if f.montant_restant == 0]

    paginator = Paginator(factures_soldees, taille)
    page_obj = paginator.get_page(page)

    result = [
        FactureOut(
            id=f.id,
            date_emission=f.date_emission,
            montant_total=float(f.montant_total),
            montant_restant=0.0,
            eleve_nom=f.eleve.nom if f.eleve else f.inscription.eleve.nom,
            eleve_prenom=f.eleve.prenom if f.eleve else f.inscription.eleve.prenom,
        )
        for f in page_obj.object_list
    ]

    return {"factures": result, "nombre_total": paginator.count}


@router.get("/factures/impayees/", response=dict)
def get_factures_impayees(
    request,
    page: int = 1,
    taille: int = 10,
):
    """
    Liste les factures partiellement ou totalement impayées (montant_restant > 0).
    """
    qs = Facture.objects.select_related("eleve", "inscription__eleve").prefetch_related(
        "details", "paiements"
    )

    factures_impayees = [f for f in qs if f.montant_restant > 0]

    paginator = Paginator(factures_impayees, taille)
    page_obj = paginator.get_page(page)

    result = [
        FactureOut(
            id=f.id,
            date_emission=f.date_emission,
            montant_total=float(f.montant_total),
            montant_restant=float(f.montant_restant),
            eleve_nom=f.eleve.nom if f.eleve else f.inscription.eleve.nom,
            eleve_prenom=f.eleve.prenom if f.eleve else f.inscription.eleve.prenom,
        )
        for f in page_obj.object_list
    ]

    return {"factures": result, "nombre_total": paginator.count}


@router.get("/factures/eleve/{eleve_id}/", response=dict)
def factures_eleve(
    request,
    eleve_id: int,
    page: int = 1,
    taille: int = 10,
):
    _ = get_object_or_404(Eleve, id=eleve_id)
    qs = Facture.objects.filter(
        models.Q(eleve_id=eleve_id) | models.Q(inscription__eleve_id=eleve_id)
    ).select_related("eleve", "inscription__eleve")
    paginator = Paginator(qs, taille)
    page_obj = paginator.get_page(page)

    return {
        "factures": [
            FacturesOut(
                id=f.id,
                date_emission=f.date_emission,
                montant_total=f.montant_total,
                montant_restant=f.montant_restant,
            )
            for f in page_obj.object_list
        ],
        "nombre_total": paginator.count,
    }


@router.get("/factures/eleve/{eleve_id}/payees/", response=dict)
def factures_eleve_payees(
    request,
    eleve_id: int,
    page: int = 1,
    taille: int = 10,
):
    qs = (
        Facture.objects.filter(
            models.Q(eleve_id=eleve_id) | models.Q(inscription__eleve_id=eleve_id)
        )
        .select_related("eleve", "inscription__eleve")
        .prefetch_related("details", "paiements")
    )

    factures_payees = [f for f in qs if f.montant_restant == 0]

    paginator = Paginator(factures_payees, taille)
    page_obj = paginator.get_page(page)

    return {
        "factures": [
            FacturesOut(
                id=f.id,
                date_emission=f.date_emission,
                montant_total=float(f.montant_total),
                montant_restant=0.0,
            )
            for f in page_obj.object_list
        ],
        "nombre_total": paginator.count,
    }


@router.get("/factures/eleve/{eleve_id}/impayees/", response=dict)
def factures_eleve_impayees(
    request,
    eleve_id: int,
    page: int = 1,
    taille: int = 10,
):
    qs = (
        Facture.objects.filter(
            models.Q(eleve_id=eleve_id) | models.Q(inscription__eleve_id=eleve_id)
        )
        .select_related("eleve", "inscription__eleve")
        .prefetch_related("details", "paiements")
    )

    factures_impayees = [f for f in qs if f.montant_restant > 0]

    paginator = Paginator(factures_impayees, taille)
    page_obj = paginator.get_page(page)

    return {
        "factures": [
            FacturesOut(
                id=f.id,
                date_emission=f.date_emission,
                montant_total=float(f.montant_total),
                montant_restant=float(f.montant_restant),
            )
            for f in page_obj.object_list
        ],
        "nombre_total": paginator.count,
    }


@router.get("/facture/{facture_id}/", response=FactureOut)
def get_facture(request, facture_id: int):
    facture = get_object_or_404(
        Facture.objects.select_related("eleve", "inscription__eleve", "eleve__garant")
               .prefetch_related("details", "paiements"),
        id=facture_id,
    )

    eleve = facture.eleve or (facture.inscription.eleve if facture.inscription else None)
    if eleve is None:
        # Par sécurité (normalement non atteignable grâce à clean())
        raise HttpError(500, "Aucun élève associé à la facture.")

    # Adresse principale = celle de l'élève
    rue, numero, npa, localite = eleve.rue, eleve.numero, eleve.npa, eleve.localite

    # Si tout est vide, on essaie l'adresse du garant (fallback)
    if not any([rue, numero, npa, localite]) and eleve.garant_id:
        g = eleve.garant
        rue, numero, npa, localite = g.rue, g.numero, g.npa, g.localite

    return FactureOut(
        id=facture.id,
        date_emission=facture.date_emission,
        date_echeance=facture.date_echeance,            # 👈 renvoyée
        montant_total=float(facture.montant_total),
        montant_restant=float(facture.montant_restant),
        eleve_nom=eleve.nom,
        eleve_prenom=eleve.prenom,
        eleve_rue=rue,
        eleve_numero=numero,
        eleve_npa=npa,
        eleve_localite=localite,
    )


@router.patch("/facture/{facture_id}/echeance/", response=FactureOut)
def set_echeance(request, facture_id: int, payload: EcheanceIn):
    facture = get_object_or_404(Facture, id=facture_id)
    facture.date_echeance = payload.date_echeance  # None pour effacer
    facture.full_clean()
    facture.save(update_fields=["date_echeance"])

    # Recrée la réponse comme dans GET
    eleve = facture.eleve or (facture.inscription.eleve if facture.inscription else None)
    if not eleve:
        raise HttpError(500, "Aucun élève associé à la facture.")
    rue, numero, npa, localite = eleve.rue, eleve.numero, eleve.npa, eleve.localite
    if not any([rue, numero, npa, localite]) and eleve.garant_id:
        g = eleve.garant
        rue, numero, npa, localite = g.rue, g.numero, g.npa, g.localite

    return FactureOut(
        id=facture.id,
        date_emission=facture.date_emission,
        date_echeance=facture.date_echeance,
        montant_total=float(facture.montant_total),
        montant_restant=float(facture.montant_restant),
        eleve_nom=eleve.nom,
        eleve_prenom=eleve.prenom,
        eleve_rue=rue,
        eleve_numero=numero,
        eleve_npa=npa,
        eleve_localite=localite,
    )


@router.get("/facture/{id_facture}/details/")
def rechercher_details_facture(request, id_facture: int):
    facture = get_object_or_404(
        Facture.objects.prefetch_related("details"), id=id_facture
    )
    details = facture.details.all()
    return [DetailFactureOut.from_orm(detail) for detail in details]


@router.post("/facture/", response={201: int, 400: dict})
def create_facture(request, payload: FactureIn):
    try:
        with transaction.atomic():
            data = payload.dict()

            details_data = data.pop("details_facture")

            if data.get("id_eleve"):
                eleve = get_object_or_404(Eleve, id=data.pop("id_eleve"))
            else:
                eleve = None

            inscription = None
            cours_prive = None

            if data.get("id_inscription"):
                inscription = get_object_or_404(
                    Inscription, id=data.pop("id_inscription")
                )

            elif data.get("id_cours_prive"):
                cours_prive = get_object_or_404(
                    CoursPrive.objects.prefetch_related("eleves"),
                    id=data.pop("id_cours_prive"),
                )
                if not cours_prive.eleves.exists():
                    raise ValidationError(
                        "Le cours privé doit avoir au moins un élève."
                    )

            else:
                return 400, {"message": "Liaison inscription ou cours_prive requise."}

            facture = Facture.objects.create(
                inscription=inscription, cours_prive=cours_prive, eleve=eleve
            )

            details = [DetailFacture(facture=facture, **d) for d in details_data]
            DetailFacture.objects.bulk_create(details)

            return 201, facture.id

    except ValidationError as e:
        return 400, {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.delete("/facture/{facture_id}/", response={204: None, 404: dict})
def delete_facture(request, facture_id: int):
    facture = get_object_or_404(Facture, id=facture_id)
    with transaction.atomic():
        facture.delete()
    return 204, None


# ------------------- PAIEMENTS -------------------


@router.post("/paiement/", response={201: int, 400: dict})
def create_paiement(request, payload: PaiementIn):
    try:
        with transaction.atomic():
            facture = get_object_or_404(Facture, id=payload.id_facture)
            paiement = Paiement.objects.create(
                montant=payload.montant,
                mode_paiement=payload.mode_paiement,
                methode_paiement=payload.methode_paiement,
                facture=facture,
            )
            return 201, paiement.id
    except ValidationError as e:
        return 400, {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.get("/paiement/{paiement_id}/", response=PaiementOut)
def get_paiement(request, paiement_id: int):
    paiement = get_object_or_404(
        Paiement.objects.select_related("facture"), id=paiement_id
    )
    return PaiementOut.from_orm(paiement)


@router.delete("/paiement/{paiement_id}/", response={204: None, 404: dict})
def delete_paiement(request, paiement_id: int):
    paiement = get_object_or_404(Paiement, id=paiement_id)
    with transaction.atomic():
        paiement.delete()
    return 204, None


@router.get("/facture/{facture_id}/paiements/", response=list[PaiementOut])
def list_paiements_for_facture(request, facture_id: int):
    get_object_or_404(Facture, id=facture_id)
    qs = Paiement.objects.filter(facture_id=facture_id)
    return [PaiementOut.from_orm(p) for p in qs]


@router.get("/paiements/eleve/{eleve_id}/", response=dict)
def paiements_eleve(
    request,
    eleve_id: int,
    page: int = 1,
    taille: int = 10,
):
    """
    Liste paginée des paiements pour un élève donné.
    """
    _ = get_object_or_404(Eleve, id=eleve_id)
    qs = (
        Paiement.objects.filter(
            models.Q(facture__eleve_id=eleve_id)
            | models.Q(facture__inscription__eleve_id=eleve_id)
        )
        .distinct()
        .order_by("-date_paiement")
    )
    paginator = Paginator(qs, taille)
    page_obj = paginator.get_page(page)
    return {
        "paiements": [PaiementOut.from_orm(p) for p in page_obj.object_list],
        "nombre_total": paginator.count,
    }


@router.get("/factures/{facture_id}/paiements/total/")
def get_total_paiements_facture(request, facture_id: int):
    paiements = Paiement.objects.filter(facture_id=facture_id)
    if not paiements.exists():
        return {"message": "Aucun paiement trouvé pour cette facture"}
    total = paiements.aggregate(total_amount=models.Sum("montant"))["total_amount"] or 0


@router.get("/paiements/", response=dict)
def paiements(request):
    qs = Paiement.objects.select_related(
        "facture",
        "facture__eleve",
        "facture__inscription__eleve"
    ).order_by("-date_paiement")

    paiements = []
    for p in qs:
        eleve = getattr(p.facture.inscription, "eleve", None) or getattr(p.facture, "eleve", None)
        paiements.append(PaiementWithEleveOut(
            id=p.id,
            date_paiement=p.date_paiement,
            montant=p.montant,
            mode_paiement=p.mode_paiement,
            methode_paiement=p.methode_paiement,
            eleve_nom=getattr(eleve, "nom", None),
            eleve_prenom=getattr(eleve, "prenom", None),
        ))

    return {"paiements": paiements}
