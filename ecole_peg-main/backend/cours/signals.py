from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Session, Inscription, StatutInscriptionChoices, StatutSessionChoices

@receiver(post_save, sender=Inscription)
def gerer_inscription_et_session(sender, instance, created, **kwargs):

    session = instance.session
    aujourd_hui = timezone.now().date()

    # 1. Si élève sorti → statut doit être INACTIF (mais on NE resauve pas ici)
    if instance.date_sortie and instance.statut != StatutInscriptionChoices.INACTIF:
        # on ne fait plus instance.save() pour éviter la boucle
        pass  

    # 2. Session terminée → on ferme tout
    if session.date_fin < aujourd_hui:
        session.inscriptions.filter(statut=StatutInscriptionChoices.ACTIF).update(
            statut=StatutInscriptionChoices.INACTIF
        )
        session.statut = StatutSessionChoices.FERMÉE
        session.save(update_fields=["statut"])
        return

    # 3. Gestion ouverture / fermeture session
    nb_actifs = session.inscriptions.filter(statut=StatutInscriptionChoices.ACTIF).count()

    if nb_actifs < session.capacite_max:
        if session.statut != StatutSessionChoices.OUVERTE:
            session.statut = StatutSessionChoices.OUVERTE
            session.save(update_fields=["statut"])
    else:
        if session.statut != StatutSessionChoices.FERMÉE:
            session.statut = StatutSessionChoices.FERMÉE
            session.save(update_fields=["statut"])
