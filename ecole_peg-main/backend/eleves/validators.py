from django.core.exceptions import ValidationError
from django.conf import settings


def file_size_validator(value):
    if value.size > settings.MAX_UPLOAD_SIZE:
        raise ValidationError(
            f"Taille maximale autorisée : {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB"
        )
