import datetime
import jwt
from ninja import Router, Schema
from django.conf import settings
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied

router = Router()


class LoginIn(Schema):
    mot_de_passe: str


class AuthOut(Schema):
    authentifie: bool = True


def generer_token():
    maintenant = datetime.datetime.now(datetime.timezone.utc)

    payload = {
        "sub": "user",
        "iat": int(maintenant.timestamp()),
        "exp": int((maintenant + settings.JWT_ACCESS_TOKEN_EXPIRES).timestamp()),
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def jwt_auth(request):
    auth_header = request.headers.get("Authorization", "")
    token = None

    if auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer ") :].strip()
    else:
        token = request.COOKIES.get("access_token")

    if not token:
        raise PermissionDenied("Les informations d'authentification n'ont pas été fournies.")

    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise PermissionDenied("Le token a expiré.")
    except jwt.InvalidTokenError:
        raise PermissionDenied("Token non valide.")

    return True


@router.post("/login/")
def login(request, data: LoginIn):
    # Vérification du mot de passe désactivée temporairement
    # if data.mot_de_passe != settings.MASTER_PASSWORD:
    #     return JsonResponse({"erreur": "Non autorisé"}, status=401)

    token = generer_token()

    response = JsonResponse({"authentifie": True})
    response.set_cookie("access_token", token, httponly=True, secure=True)

    return response


@router.get("/est_authentifie/", auth=jwt_auth)
def est_authentifie(request) -> AuthOut:
    return AuthOut()


@router.post("/logout/")
def logout(request):
    reponse = JsonResponse({"message": "Déconnecté"})
    reponse.delete_cookie("access_token")

    return reponse


@router.post("/refresh/")
def refresh_token(request):
    try:
        jwt_auth(request)

        token = generer_token()

        response = JsonResponse({"message": "Token rafraîchi"})

        response.set_cookie("access_token", token, httponly=True, secure=True)
        
        return response
    except PermissionDenied:
        return JsonResponse({"erreur": "Non autorisé"}, status=401)
