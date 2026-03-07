from django.core.exceptions import ValidationError
from django.db.models import Sum
from django.core.validators import MinValueValidator
from django.db import models, transaction


class ModePaiementChoices(models.TextChoices):
    PERSONNEL = "PER", "Personnel"
    BON_FORMATION = "BPA", "Bon de formation"
    CHEQUE_FORMATION = "CAF", "Chèque de formation"
    HOSPICES_GENERAL = "HOS", "Hospices général"
    AUTRE = "AUT", "Autre"


class MethodePaiementChoices(models.TextChoices):
    ESPECE = "ESP", "Espèce"
    CARTE = "CAR", "Carte bancaire"
    VIREMENT = "VIR", "Virement"
    TWINT = "TWI", "Twint"
    TELEPHONE = "TEL", "Téléphone"
    PAYPAL = "PAY", "PayPal"
    AUTRE = "AUT", "Autre"


class Facture(models.Model):
    date_emission = models.DateField(auto_now_add=True)
    date_echeance = models.DateField(null=True, blank=True)
    inscription = models.ForeignKey(
        "cours.Inscription",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="factures",
    )
    cours_prive = models.ForeignKey(
        "cours.CoursPrive",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="factures",
    )
    eleve = models.ForeignKey(
        "eleves.Eleve",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="factures",
    )

    _cached_montant_total = None
    _cached_montant_restant = None

    class Meta:
        ordering = ["date_emission"]

    @property
    def montant_total(self):
        if self._cached_montant_total is None:
            self._cached_montant_total = (
                self.details.aggregate(total=Sum("montant"))["total"] or 0
            )
        return self._cached_montant_total

    @property
    def montant_restant(self):
        if self._cached_montant_restant is None:
            total_paiements = (
                self.paiements.aggregate(total=Sum("montant"))["total"] or 0
            )
            self._cached_montant_restant = max(self.montant_total - total_paiements, 0)
        return self._cached_montant_restant

    def reset_cache(self):
        self._cached_montant_total = None
        self._cached_montant_restant = None

    def clean(self):
        """Validation pour s'assurer que les relations inscription, cours_prive et eleve respectent les contraintes."""
        super().clean()

        if self.inscription:
            if self.cours_prive or self.eleve:
                raise ValidationError(
                    "Si 'inscription' est défini, 'cours_prive' et 'eleve' doivent être null."
                )

        if self.cours_prive:
            if not self.eleve:
                raise ValidationError(
                    "Si 'cours_prive' est défini, 'eleve' doit être défini."
                )
            if self.inscription:
                raise ValidationError(
                    "Si 'cours_prive' est défini, 'inscription' doit être null."
                )

        if self.eleve:
            if not self.cours_prive:
                raise ValidationError(
                    "Si 'eleve' est défini, 'cours_prive' doit être défini."
                )
            if self.inscription:
                raise ValidationError(
                    "Si 'eleve' est défini, 'inscription' doit être null."
                )

        if not self.inscription and not self.cours_prive and not self.eleve:
            raise ValidationError(
                "La facture doit être liée soit à une inscription, soit à un cours privé avec un élève."
            )


class DetailFacture(models.Model):
    description = models.CharField(max_length=100)
    date_debut_periode = models.DateField(blank=True, null=True)
    date_fin_periode = models.DateField(blank=True, null=True)
    montant = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    facture = models.ForeignKey(
        Facture, on_delete=models.CASCADE, related_name="details"
    )

    def clean(self):
        super().clean()
        if self.date_debut_periode and not self.date_fin_periode:
            raise ValidationError(
                "La date de fin de période doit être définie si la date de début est définie."
            )
        if self.date_fin_periode and not self.date_debut_periode:
            raise ValidationError(
                "La date de début de période doit être définie si la date de fin est définie."
            )
        if self.date_debut_periode and self.date_fin_periode:
            if self.date_debut_periode > self.date_fin_periode:
                raise ValidationError(
                    "La date de début doit être antérieure à la date de fin."
                )


class Paiement(models.Model):
    date_paiement = models.DateField(auto_now_add=True)
    montant = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    mode_paiement = models.CharField(max_length=3, choices=ModePaiementChoices.choices)
    methode_paiement = models.CharField(
        blank=True, null=True, max_length=3, choices=MethodePaiementChoices.choices
    )
    facture = models.ForeignKey(
        Facture, on_delete=models.CASCADE, related_name="paiements"
    )

    class Meta:
        ordering = ["-date_paiement"]

    def clean(self):
        super().clean()
        if self.facture:
            if self.facture.montant_restant == 0:
                raise ValidationError("La facture est déjà entièrement payée.")
            if self.montant > self.facture.montant_restant:
                raise ValidationError(
                    f"Le paiement ne peut pas excéder {self.facture.montant_restant} CHF."
                )
        if self.montant <= 0:
            raise ValidationError("Le montant du paiement doit être supérieur à 0.")
