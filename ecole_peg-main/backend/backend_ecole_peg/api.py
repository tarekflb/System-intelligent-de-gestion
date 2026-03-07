from ninja import NinjaAPI
from eleves.api import router as eleves_router
from cours.api import router as cours_router
from factures.api import router as factures_router
from .auth_api import router as auth_router

api = NinjaAPI(title="API École PEG", version="1.0")
api.add_router("/eleves/", eleves_router, tags=["Élèves"])
api.add_router("/cours/", cours_router, tags=["Cours"])
api.add_router("/factures/", factures_router, tags=["Factures"])
api.add_router("/auth/", auth_router, tags=["Auth"])
