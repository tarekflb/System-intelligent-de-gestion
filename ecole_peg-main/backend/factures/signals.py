from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from django.db.models import Q
from .models import DetailFacture, Paiement, Facture


@receiver([post_save, post_delete], sender=DetailFacture)
def reset_facture_cache_on_detail_change(sender, instance, **kwargs):
    if instance.facture:
        transaction.on_commit(lambda: instance.facture.reset_cache())


@receiver([post_save, post_delete], sender=Paiement)
def reset_facture_cache_on_paiement_change(sender, instance, **kwargs):
    if instance.facture:
        transaction.on_commit(lambda: instance.facture.reset_cache())

