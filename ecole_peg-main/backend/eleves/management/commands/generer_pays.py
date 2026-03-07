from django.core.management.base import BaseCommand
from eleves.scripts.generer_donnees_pays import generer_donnees_pays


class Command(BaseCommand):
    help = "Générer les données des pays"

    def handle(self, *args, **options):
        generer_donnees_pays()
        self.stdout.write(self.style.SUCCESS("Les données des pays ont été générées avec succès."))
