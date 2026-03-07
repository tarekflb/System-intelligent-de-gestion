from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv, find_dotenv

# Au lieu de: load_dotenv(BASE_DIR / ".env")
load_dotenv(find_dotenv(usecwd=True), override=True)

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Secrets / JWT ---
MASTER_PASSWORD = os.getenv("MASTER_PASSWORD", "admin123")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me")
JWT_ACCESS_TOKEN_EXPIRES = timedelta(
    minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "15"))
)

# --- Django core ---
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-key")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "ninja",
    "corsheaders",
    "cours.apps.CoursConfig",
    "eleves",
    "factures.apps.FacturesConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend_ecole_peg.urls"
WSGI_APPLICATION = "backend_ecole_peg.wsgi.application"

# --- CORS ---
CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL_ORIGINS", "True").lower() == "true"
CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --- Base de données : MariaDB/MySQL via PyMySQL ---
import pymysql
pymysql.install_as_MySQLdb()

#---DATABASES = {
#    "default": {
#        "ENGINE": "django.db.backends.mysql",
 #       "NAME": os.getenv("DB_NAME"),
  #      "USER": os.getenv("DB_USER"),
   #     "PASSWORD": os.getenv("DB_PASSWORD"),
    #    "HOST": os.getenv("DB_HOST", "localhost"),
     #   "PORT": os.getenv("DB_PORT", "3306"),
      #  "OPTIONS": {
       #     "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
        #},
    #}
#}
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# --- Password validation ---
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- I18N / TZ ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# --- Static & Media ---
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# --- Cookies / Sécurité (mets True seulement si HTTPS activé) ---
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "False").lower() == "true"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "False").lower() == "true"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
