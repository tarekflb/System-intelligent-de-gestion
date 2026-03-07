from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.utils import timezone
from django.db import transaction, models, IntegrityError
from django.db.models import (
    OuterRef,
    Subquery,
    Sum,
    F,
    Value,
    DecimalField,
    ExpressionWrapper,
    Count,
    Q,
)
from django.db.models.functions import Coalesce, Lower
from ninja import Router, File, Form
from ninja.files import UploadedFile
from typing import Optional  # 👈 ajouté

from .models import (
    Eleve,
    Pays,
    Garant,
    Test,
    Document,
)
from factures.models import Facture, Paiement, DetailFacture
from .schemas import (
    Anniversaire,
    GarantIn,
    GarantOut,
    PaysOut,
    TestIn,
    TestOut,
    DocumentOut,
    EleveIn,
    EleveOut,
    ElevesOut,
)
from cours.models import Cours, CoursPrive, Session, Enseignant


router = Router()


# ------------------- ÉLÈVES -------------------
@router.get("/eleves/", response=dict)
def eleves(
    request,
    page: int = 1,
    taille: int = 10,
    recherche: Optional[str] = None,
    date_naissance: Optional[str] = None,
    statut: Optional[str] = None,
):
    qs = Eleve.objects.select_related("pays").annotate(
        lower_nom=Lower("nom"),
        lower_prenom=Lower("prenom"),
        pays__nom=F("pays__nom"),
        active_count=Count(
            "inscriptions",
            filter=Q(inscriptions__statut="A"),
            distinct=True,
        ),
        preinsc_count=Count(
            "inscriptions",
            filter=Q(inscriptions__preinscription=True),
            distinct=True,
        ),
    )

    if recherche:
        qs = qs.filter(Q(nom__icontains=recherche) | Q(prenom__icontains=recherche))

    if date_naissance:
        qs = qs.filter(date_naissance=date_naissance)

    if statut and statut != "tous":
        if statut == "A":
            qs = qs.filter(active_count__gt=0, preinsc_count=0)
        elif statut == "I":
            qs = qs.filter(active_count=0)
        elif statut == "P":
            qs = qs.filter(preinsc_count__gt=0)

    qs = qs.order_by("lower_nom", "lower_prenom")

    paginator = Paginator(qs, taille)
    page_obj = paginator.get_page(page)

    return {
        "eleves": [
            ElevesOut.model_validate(e, from_attributes=True)
            for e in page_obj.object_list
        ],
        "nombre_total": paginator.count,
    }


@router.get("/eleve/{id_eleve}/")
def rechercher_eleve(request, id_eleve: int):
    try:
        eleve = (
            Eleve.objects.select_related("pays")
            .annotate(pays__nom=models.F("pays__nom"))
            .get(id=id_eleve)
        )
    except Eleve.DoesNotExist:
        return {"Erreur": "Cet élève n'existe pas"}

    return EleveOut.model_validate(eleve, from_attributes=True)


@router.post("/eleve/")
def creer_eleve(request, eleve: EleveIn):
    from django.http import JsonResponse
    try:
        with transaction.atomic():
            pays = get_object_or_404(Pays, id=eleve.pays_id)
            data = eleve.dict(exclude={"pays_id"})

            # Normalisation: "" => None + trim
            for k in (
                "rue","numero","npa","localite","adresse_facturation",
                "langue_maternelle","autres_langues","src_decouverte","commentaires"
            ):
                v = data.get(k)
                if isinstance(v, str):
                    v = v.strip()
                    data[k] = v or None

            obj = Eleve(pays=pays, **data)
            obj.full_clean()
            obj.save()
            return {"id": obj.id}

    except ValidationError as e:
        return JsonResponse({"message": "Erreurs de validation.", "erreurs": e.message_dict}, status=422)
    except IntegrityError as e:
        return JsonResponse({"message": "Conflit d’unicité (probablement l’email)."}, status=409)


@router.put("/eleves/{eleve_id}/")
def modifier_eleve(request, eleve_id: int, eleve: EleveIn):
    try:
        with transaction.atomic():
            eleve_obj = get_object_or_404(
                Eleve.objects.select_related("pays"), id=eleve_id
            )
            pays = get_object_or_404(Pays, id=eleve.pays_id)
            for field, value in eleve.dict(exclude={"pays_id"}).items():
                setattr(eleve_obj, field, value)
            eleve_obj.pays = pays
            eleve_obj.full_clean()
            eleve_obj.save()
            return {"id": eleve_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.delete("/eleves/{eleve_id}/")
def supprimer_eleve(request, eleve_id: int):
    with transaction.atomic():
        eleve = get_object_or_404(Eleve, id=eleve_id)
        eleve.delete()


# ------------------- GARANTS -------------------


@router.get("/eleves/{eleve_id}/garant/")
def get_garant_eleve(request, eleve_id: int):
    eleve = get_object_or_404(Eleve.objects.select_related("garant"), id=eleve_id)
    if not eleve.garant:
        return {"message": "Aucun garant trouvé pour cet élève."}
    return GarantOut.model_validate(eleve.garant, from_attributes=True)


@router.post("/eleves/{eleve_id}/garant/")
def creer_garant_eleve(request, eleve_id: int, garant: GarantIn):
    try:
        with transaction.atomic():
            eleve = get_object_or_404(
                Eleve.objects.select_related("garant"), id=eleve_id
            )
            garant_data = garant.dict()
            garant_obj, _ = Garant.objects.get_or_create(
                nom=garant_data["nom"],
                prenom=garant_data["prenom"],
                telephone=garant_data["telephone"],
                email=garant_data["email"],
                defaults=garant_data,
            )
            eleve.garant = garant_obj
            eleve.save()
            return {"id": garant_obj.id}
    except ValidationError as e:
        return {"message": "Données invalides.", "erreurs": e.message_dict}


@router.put("/eleves/{eleve_id}/garant/")
def modifier_garant_eleve(request, eleve_id: int, garant: GarantIn):
    try:
        with transaction.atomic():
            eleve = get_object_or_404(
                Eleve.objects.select_related("garant"), id=eleve_id
            )
            if not eleve.garant:
                return {"message": "Aucun garant trouvé pour cet élève."}
            for field, value in garant.dict().items():
                setattr(eleve.garant, field, value)
            eleve.garant.full_clean()
            eleve.garant.save()
            return {"id": eleve.garant.id}
    except ValidationError as e:
        return {"message": "Données invalides.", "erreurs": e.message_dict}


@router.delete("/eleves/{eleve_id}/garant/")
def supprimer_garant_eleve(request, eleve_id: int):
    with transaction.atomic():
        eleve = get_object_or_404(Eleve.objects.select_related("garant"), id=eleve_id)
        if not eleve.garant:
            return {"message": "Aucun garant trouvé pour cet élève."}
        eleve.garant = None
        eleve.save()
        return {"success": True}


# ------------------- TESTS -------------------


@router.get("/eleves/{eleve_id}/tests/")
def get_tests_eleve(request, eleve_id: int):
    eleve = get_object_or_404(Eleve.objects.prefetch_related("tests"), id=eleve_id)
    tests = eleve.tests.all().order_by("-date_test")
    return [TestOut.model_validate(t, from_attributes=True) for t in tests]


@router.post("/eleves/{eleve_id}/tests/")
def creer_test_eleve(request, eleve_id: int, test: TestIn):
    try:
        with transaction.atomic():
            eleve = get_object_or_404(Eleve, id=eleve_id)
            test_obj = Test(eleve=eleve, **test.dict())
            test_obj.full_clean()
            test_obj.save()
            return {"id": test_obj.id}
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.delete("/eleves/{eleve_id}/tests/{test_id}/")
def supprimer_test_eleve(request, eleve_id: int, test_id: int):
    with transaction.atomic():
        test = get_object_or_404(
            Test.objects.select_related("eleve"), id=test_id, eleve_id=eleve_id
        )
        test.delete()


# ------------------- DOCUMENTS -------------------
@router.get("/eleves/{eleve_id}/documents/", response=list[DocumentOut])
def get_documents_eleve(request, eleve_id: int):
    eleve = get_object_or_404(Eleve.objects.prefetch_related("documents"), id=eleve_id)
    documents = eleve.documents.all()
    return [DocumentOut.from_model(doc, request) for doc in documents]


@router.post("/eleves/{eleve_id}/documents/")
def creer_document_eleve(
    request, eleve_id: int, nom: str = Form(...), fichier: UploadedFile = File(...)
):
    try:
        with transaction.atomic():
            eleve = get_object_or_404(Eleve, id=eleve_id)
            document = Document(eleve=eleve, nom=nom)
            document.fichier.save(fichier.name, fichier)
            document.full_clean()
            document.save()
            return DocumentOut.from_model(document, request)
    except ValidationError as e:
        return {"message": "Erreurs de validation.", "erreurs": e.message_dict}


@router.delete("/eleves/{eleve_id}/documents/{document_id}/")
def supprimer_document_eleve(request, eleve_id: int, document_id: int):
    with transaction.atomic():
        document = get_object_or_404(
            Document.objects.select_related("eleve"), id=document_id, eleve_id=eleve_id
        )
        if document.fichier and document.fichier.storage.exists(document.fichier.name):
            document.fichier.delete(save=False)
        document.delete()
        return {"success": True}


# ------------------- PAYS -------------------
@router.get("/pays/")
def pays(request):
    pays_list = Pays.objects.all().order_by("nom")
    return [PaysOut.model_validate(p, from_attributes=True) for p in pays_list]


# ------------------- STATISTIQUES -------------------
@router.get("/statistiques/dashboard/")
def statistiques_dashboard(request):
    today = timezone.now().date()
    first_day_month = today.replace(day=1)
    five_days_ago = today - timedelta(days=5)

    # Sous‐requêtes pour total et payé
    total_sq = (
        DetailFacture.objects.filter(facture=OuterRef("pk"))
        .values("facture")
        .annotate(t=Sum("montant"))
        .values("t")
    )
    paye_sq = (
        Paiement.objects.filter(facture=OuterRef("pk"))
        .values("facture")
        .annotate(p=Sum("montant"))
        .values("p")
    )

    # === MONTANT TOTAL IMPAYÉ (toutes factures, toutes périodes) ===
    impayees_qs = (
        Facture.objects
        .annotate(
            total=Coalesce(Subquery(total_sq), Value(0), output_field=DecimalField()),
            paye=Coalesce(Subquery(paye_sq), Value(0), output_field=DecimalField()),
        )
        .annotate(restant=F("total") - F("paye"))
        .filter(restant__gt=0)
    )

    montant_total_factures_impayees = impayees_qs.aggregate(
        total_restant=Coalesce(Sum("restant"), Value(0), output_field=DecimalField())
    )["total_restant"]

    # (facultatif mais pratique pour le front)
    nombre_factures_impayees = impayees_qs.count()

    # --- Montant total des paiements du mois ---
    montant_total_paiements_mois = Paiement.objects.filter(
        date_paiement__gte=first_day_month
    ).aggregate(total=Coalesce(Sum("montant"), Value(0), output_field=DecimalField()))[
        "total"
    ]

    # --- Détail des factures impayées depuis ≥5 jours ---
    factures_5j = (
        Facture.objects.filter(date_emission__lte=five_days_ago)
        .annotate(
            total=Coalesce(Subquery(total_sq), Value(0), output_field=DecimalField()),
            paye=Coalesce(Subquery(paye_sq), Value(0), output_field=DecimalField()),
        )
        .annotate(restant=F("total") - F("paye"))
        .filter(restant__gt=0)
        .select_related("eleve", "inscription__eleve")
        .annotate(
            eleve_nom=F("eleve__nom"),
            eleve_prenom=F("eleve__prenom"),
        )
        .values(
            "id",
            "date_emission",
            "total",
            "restant",
            "eleve_nom",
            "eleve_prenom",
        )
    )

    factures_impayees_plus_5j = [
        {
            "id": f["id"],
            "date_emission": f["date_emission"],
            "montant_total": float(f["total"]),
            "montant_restant": float(f["restant"]),
            "eleve_nom": f["eleve_nom"],
            "eleve_prenom": f["eleve_prenom"],
        }
        for f in factures_5j
    ]

    # --- Répartition par cours-type-niveau des élèves actifs ---
    repartition_cours = list(
        Eleve.objects.filter(inscriptions__statut="A")
        .values(
            "inscriptions__session__cours__nom",
            "inscriptions__session__cours__type_cours",
            "inscriptions__session__cours__niveau",
        )
        .annotate(total=Count("id"))
        .order_by("inscriptions__session__cours__nom")
    )

    # --- Présence < 80% lors des 7 derniers jours de session ---
    eleves_presence_inferieur_80 = []
    for eleve in Eleve.objects.filter(inscriptions__statut="A").distinct():
        for ins in eleve.inscriptions.filter(statut="A"):
            sess = ins.session
            if sess.date_fin - timedelta(days=7) <= today <= sess.date_fin:
                total_seances = sess.seances_mois
                if total_seances:
                    nb_present = eleve.presences.filter(
                        fiche_presences__session=sess, statut="P"
                    ).count()
                    taux = (nb_present / total_seances) * 100
                    if taux < 80:
                        eleves_presence_inferieur_80.append(
                            {
                                "nom": eleve.nom,
                                "prenom": eleve.prenom,
                                "date_naissance": eleve.date_naissance,
                                "taux_presence": round(taux, 2),
                            }
                        )

    # --- Élèves en préinscription depuis >3 jours ---
    date_limite = today - timedelta(days=3)
    eleves_preinscrits = list(
        Eleve.objects.filter(
            inscriptions__preinscription=True,
            inscriptions__date_inscription__lte=date_limite,
        )
        .values("nom", "prenom", "date_naissance")
        .distinct()
    )

    # --- Statistiques générales supplémentaires ---
    total_cours = Cours.objects.count()
    sessions_actives = Session.objects.filter(statut="O").count()
    cours_prives_programmes = CoursPrive.objects.filter(
        date_cours_prive__gte=first_day_month
    ).count()
    sessions_ouvertes = list(
        Session.objects.filter(statut="O")
        .annotate(
            eleves_restants=ExpressionWrapper(
                F("capacite_max")
                - Count("inscriptions", filter=Q(inscriptions__statut="A")),
                output_field=DecimalField(),
            )
        )
        .values("date_debut", "eleves_restants")
        .order_by("date_debut")
    )
    nombre_enseignants = Enseignant.objects.count()
    total_eleves = Eleve.objects.count()
    eleves_actifs = Eleve.objects.filter(inscriptions__statut="A").distinct().count()

    pays_counts = (
        Eleve.objects.values("pays__nom")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    max_total = pays_counts.first()["total"] if pays_counts else None
    pays_plus_eleves = [p["pays__nom"] for p in pays_counts if p["total"] == max_total] if max_total else []

    return {
        "factures": {
            "montant_total_paiements_mois": float(montant_total_paiements_mois),
            "montant_total_factures_impayees": float(montant_total_factures_impayees),
            "nombre_factures_impayees": nombre_factures_impayees,
            "factures_impayees_plus_5j": factures_impayees_plus_5j,
        },
        "cours": {
            "total_cours": total_cours,
            "sessions_actives": sessions_actives,
            "cours_prives_programmes_mois": cours_prives_programmes,
            "sessions_ouvertes": sessions_ouvertes,
            "nombre_enseignants": nombre_enseignants,
            "repartition_eleves_actifs": repartition_cours,
        },
        "eleves": {
            "total_eleves": total_eleves,
            "eleves_actifs": eleves_actifs,
            "pays_plus_eleves": pays_plus_eleves,
            "eleves_presence_inferieur_80": eleves_presence_inferieur_80,
            "eleves_preinscription_plus_3j": eleves_preinscrits,
        },
    }


@router.get("/anniversaires/", response=list[Anniversaire])
def anniversaires_mois(request, mois: Optional[int] = None, annee: Optional[int] = None):
    aujourdhui = timezone.localdate()
    mois_actuel = mois or aujourdhui.month
    annee_actuelle = annee or aujourdhui.year

    if mois_actuel < 1 or mois_actuel > 12:
        # Optionnel: tu peux lever une 400 ici si tu veux
        mois_actuel = aujourdhui.month

    qs = (
        Eleve.objects.filter(
            date_naissance__month=mois_actuel,
            inscriptions__statut="A",
            inscriptions__preinscription=False,
        )
        .distinct()
        .order_by("date_naissance__day")
    )

    resultat = []
    for eleve in qs:
        date_naissance = eleve.date_naissance
        # Âge atteint à l’anniversaire de l'année sélectionnée
        age_ce_mois = annee_actuelle - date_naissance.year

        resultat.append(
            Anniversaire.model_validate(
                {
                    "id": eleve.id,
                    "nom": eleve.nom,
                    "prenom": eleve.prenom,
                    "date_naissance": date_naissance,
                    "age": age_ce_mois,
                }
            )
        )

    return resultat
