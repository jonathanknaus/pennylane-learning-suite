"""Msgspec structs — validation + sérialisation JSON."""
import msgspec
from typing import Any


class Entreprise(msgspec.Struct, kw_only=True):
    id: str | None = None
    nom: str
    adresse: str | None = None
    code_postal: str | None = None
    ville: str | None = None
    siret: str | None = None
    contact_nom: str | None = None
    contact_prenom: str | None = None
    contact_email: str | None = None
    contact_tel: str | None = None
    notes: str | None = None
    created_at: str | None = None


class Stagiaire(msgspec.Struct, kw_only=True):
    id: str | None = None
    entreprise_id: str | None = None
    nom: str
    prenom: str
    email: str | None = None
    tel: str | None = None
    poste: str | None = None
    notes: str | None = None
    created_at: str | None = None


class Formateur(msgspec.Struct, kw_only=True):
    id: str | None = None
    nom: str
    prenom: str
    email: str | None = None
    tel: str | None = None
    type: str = "interne"
    siret: str | None = None
    adresse: str | None = None
    actif: bool = True
    created_at: str | None = None


class SessionCreneau(msgspec.Struct, kw_only=True):
    id: str | None = None
    session_id: str | None = None
    date: str
    heure_debut: str
    heure_fin: str
    intervenant: str | None = None
    ordre: int = 0


class Session(msgspec.Struct, kw_only=True):
    id: str | None = None
    code: str | None = None
    titre: str
    entreprise_id: str | None = None
    formateur_id: str | None = None
    modules: list[str] = []
    format: str | None = None
    modalite: str = "visio"
    lieu: str | None = None
    date_debut: str | None = None
    date_fin: str | None = None
    heure_debut: str | None = None
    heure_fin: str | None = None
    participants_max: int = 15
    statut: str = "en_projet"
    prix_ht: float | None = None
    tva_pct: float = 20.0
    opco_nom: str | None = None
    opco_montant: float | None = None
    acompte_pct: int | None = None
    notes: str | None = None
    creneaux: list[SessionCreneau] = []
    created_at: str | None = None
    updated_at: str | None = None


class Inscription(msgspec.Struct, kw_only=True):
    id: str | None = None
    session_id: str
    stagiaire_id: str
    statut: str = "inscrit"
    presence: bool | None = None
    created_at: str | None = None


class QuestionnaireReponse(msgspec.Struct, kw_only=True):
    session_id: str
    stagiaire_id: str
    type: str  # pre | post
    questions: list[Any]
    reponses: dict[str, str]
    score: int


class EnqueteReponse(msgspec.Struct, kw_only=True):
    session_id: str
    stagiaire_id: str
    type: str  # chaud | froid
    reponses: dict[str, Any]


class FactureLigne(msgspec.Struct, kw_only=True):
    intitule: str
    qte: float = 1
    prix_ht: float
    tva_pct: float = 20.0


class Facture(msgspec.Struct, kw_only=True):
    id: str | None = None
    session_id: str | None = None
    entreprise_id: str | None = None
    numero: str | None = None
    type: str = "facture"
    lignes: list[FactureLigne]
    total_ht: float
    total_tva: float
    total_ttc: float
    opco_nom: str | None = None
    opco_montant: float | None = None
    statut: str = "brouillon"
    date_emission: str | None = None
    date_echeance: str | None = None
    notes: str | None = None
    created_at: str | None = None


class UserLogin(msgspec.Struct, kw_only=True):
    email: str
    password: str


class EmailDestinataire(msgspec.Struct, kw_only=True):
    email: str
    nom: str | None = None
    stagiaire_id: str | None = None
    html: str  # corps HTML déjà rendu par le frontend (1 par destinataire)


class EmailEnvoi(msgspec.Struct, kw_only=True):
    type: str  # convocation | attestation | emargement
    sujet: str
    session_id: str | None = None
    joindre_pdf: bool = True  # joindre le document en PDF (sinon email HTML seul)
    destinataires: list[EmailDestinataire]
