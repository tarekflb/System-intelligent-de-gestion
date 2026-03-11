# 🏫 École PEG — Système de Gestion Administrative

> Application web complète pour la gestion administrative d'une école de langues (FLE) — développée dans le cadre d'un mémoire de Licence à l'USTHB.

![Django](https://img.shields.io/badge/Backend-Django%20%2B%20Django%20Ninja-092E20?style=flat&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%20%2B%20React-000000?style=flat&logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Style-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## 📌 Présentation

**École PEG** est une institution genevoise fondée en 1968, spécialisée dans l'enseignement du **Français Langue Étrangère (FLE)**. Face aux limites d'une gestion 100 % manuelle (fichiers Excel dispersés, formulaires papier, facturation chronophage), ce projet propose une **plateforme web moderne** pour centraliser et automatiser l'ensemble des processus administratifs de l'école.

Ce projet a été réalisé par une équipe de 4 étudiants de la **Faculté d'Informatique de l'USTHB** (spécialité Systèmes d'Information et de Logiciel), encadrés par **M. Riadh Babaali**.

---

## ✨ Fonctionnalités principales

### 👨‍🎓 Gestion des élèves
- Création et modification des fiches élèves (informations personnelles, permis de séjour, niveau de langue)
- Gestion des garants (un garant par élève)
- Suivi des documents administratifs
- Historique des tests de niveau (CECRL : A1 → C1)

### 📚 Gestion des cours & sessions
- Création des types de cours (intensif / semi-intensif, par niveau)
- Planification des sessions (dates, capacité, enseignant assigné, période matin/soir)
- Gestion des cours privés (à l'école ou à domicile)
- Suivi des inscriptions et préinscriptions

### ✅ Gestion des présences
- Fiches de présence mensuelles par session
- Calcul automatique du taux d'assiduité par élève
- Alertes automatiques en cas de présence < 80 % (exigence légale pour les permis suisses)

### 💰 Gestion financière
- Génération semi-automatisée de factures (inscription ou cours privé)
- Suivi des paiements (espèces, virement, carte, TWINT)
- Modes de prise en charge multiples (personnel, BPA, CAF, Hospice général)
- Système de rappels progressifs avec pénalités (25 CHF → 50 CHF → exclusion)

### 📊 Tableau de bord
- Statistiques en temps réel : élèves actifs, montants reçus/impayés, sessions ouvertes
- Alertes sur factures impayées depuis plus de 3 jours
- Répartition des cours et places disponibles par session
- Anniversaires du mois et pays d'origine majoritaire

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Python, Django, Django Ninja (API RESTful typée) |
| Base de données | PostgreSQL (transactions ACID) |
| Validation | Pydantic (via Django Ninja) |
| Versioning | Git & GitHub |
| IDE | Visual Studio Code |

---

## 🗂️ Architecture du projet

```
ecole-peg/
├── backend/                  # Django + Django Ninja
│   ├── eleves/               # App : gestion des élèves
│   ├── cours/                # App : cours, sessions, présences
│   ├── facturation/          # App : factures, paiements
│   ├── core/                 # Modèles communs (Personne, Pays...)
│   └── manage.py
│
├── frontend/                 # Next.js + React
│   ├── app/                  # Routes (App Router)
│   │   ├── dashboard/
│   │   ├── eleves/
│   │   ├── cours/
│   │   ├── sessions/
│   │   ├── factures/
│   │   └── cours-prives/
│   ├── components/           # Composants réutilisables
│   └── lib/                  # Appels API
│
└── README.md
```

---

## 🚀 Installation & lancement

### Prérequis

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Backend (Django)

```bash
# Cloner le projet
git clone https://github.com/votre-username/ecole-peg.git
cd ecole-peg/backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows : venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL

# Appliquer les migrations
python manage.py migrate

# Lancer le serveur
python manage.py runserver
```

### Frontend (Next.js)

```bash
cd ecole-peg/frontend

# Installer les dépendances
npm install

# Configurer l'URL de l'API
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

---

## 🔐 Authentification

L'accès à l'application est protégé par un mot de passe administrateur. Il n'y a pour l'instant qu'un seul rôle (administrateur/secrétaire), conformément aux besoins actuels de l'École PEG.

---

## 📐 Modèle de données (entités principales)

```
Eleve ──── Garant
  │
  ├── Test
  ├── Document
  ├── Inscription ──── Session ──── Cours
  │                              └── Enseignant
  ├── Facture ──── DetailFacture
  │           └── Paiement
  ├── CoursPrive
  └── Presence ──── FichePresences
```

---

## 📸 Aperçu de l'interface

| Tableau de bord | Fiche élève |
|---|---|
| Statistiques en temps réel, alertes, sessions ouvertes | Informations personnelles, inscriptions, factures, présences |

| Liste des cours | Gestion des factures |
|---|---|
| Filtrage par niveau et type | Génération, suivi et paiement en quelques clics |

---

## 📈 Résultats & impact

- ⏱️ **~60% de réduction** du temps consacré aux tâches administratives répétitives
- ✅ Centralisation complète des données dans une base PostgreSQL unique
- 🔔 Alertes automatiques sur les présences et les impayés
- 📋 Conformité facilitée avec les exigences légales suisses (80% de présence obligatoire)
- 📱 Interface responsive, fonctionnelle sur tous les écrans

---

## 🔭 Perspectives d'évolution

- [ ] Portail élève : consultation des notes, absences et factures
- [ ] Portail enseignant : saisie des présences directement depuis la classe
- [ ] Notifications par email (rappels de paiement, alertes d'assiduité)
- [ ] Application mobile avec mode hors-ligne
- [ ] Tableaux de bord analytiques avancés
- [ ] Exports PDF des rapports et factures

---


## 📄 Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

> *Mémoire de Licence — Spécialité Systèmes d'Information et de Logiciel — USTHB 2025*  
> *Groupe n°001/2025*
