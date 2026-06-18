-- Pennylane Learning Suite — schéma PostgreSQL
-- Exécuter une fois : psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Utilisateurs (équipe AFS) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS utilisateurs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    nom         TEXT NOT NULL,
    prenom      TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('admin','formateur')),
    password_hash TEXT NOT NULL,
    actif       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Entreprises / Cabinets commanditaires ───────────────────────────────────
CREATE TABLE IF NOT EXISTS entreprises (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom             TEXT NOT NULL,
    adresse         TEXT,
    code_postal     TEXT,
    ville           TEXT,
    siret           TEXT,
    contact_nom     TEXT,
    contact_prenom  TEXT,
    contact_email   TEXT,
    contact_tel     TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Stagiaires ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stagiaires (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID REFERENCES entreprises(id) ON DELETE SET NULL,
    nom             TEXT NOT NULL,
    prenom          TEXT NOT NULL,
    email           TEXT,
    tel             TEXT,
    poste           TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Formateurs (internes ou freelance) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS formateurs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom             TEXT NOT NULL,
    prenom          TEXT NOT NULL,
    email           TEXT,
    tel             TEXT,
    type            TEXT NOT NULL CHECK (type IN ('interne','freelance')) DEFAULT 'interne',
    siret           TEXT,   -- pour contrat sous-traitance freelance
    adresse         TEXT,
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Sessions de formation ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT UNIQUE NOT NULL,  -- AFS-0001
    titre           TEXT NOT NULL,
    entreprise_id   UUID REFERENCES entreprises(id) ON DELETE SET NULL,
    formateur_id    UUID REFERENCES formateurs(id) ON DELETE SET NULL,
    modules         JSONB NOT NULL DEFAULT '[]',  -- ids catalogue
    format          TEXT,   -- session_1h, demi_journee, etc.
    modalite        TEXT NOT NULL CHECK (modalite IN ('visio','presentiel')) DEFAULT 'visio',
    lieu            TEXT,
    date_debut      DATE,
    date_fin        DATE,
    heure_debut     TIME,
    heure_fin       TIME,
    participants_max INT NOT NULL DEFAULT 15,
    statut          TEXT NOT NULL CHECK (statut IN ('en_projet','validee','a_facturer','terminee','annulee')) DEFAULT 'en_projet',
    prix_ht         NUMERIC(10,2),
    tva_pct         NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    opco_nom        TEXT,
    opco_montant    NUMERIC(10,2),
    acompte_pct     INT,   -- % d'acompte si applicable
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Séquence et trigger pour les codes AFS-XXXX
CREATE SEQUENCE IF NOT EXISTS sessions_code_seq START 1;

CREATE OR REPLACE FUNCTION sessions_auto_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := 'AFS-' || LPAD(nextval('sessions_code_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sessions_code ON sessions;
CREATE TRIGGER trg_sessions_code
    BEFORE INSERT ON sessions
    FOR EACH ROW EXECUTE FUNCTION sessions_auto_code();

-- ── Créneaux horaires d'une session (tableau dates/horaires/intervenant) ─────
CREATE TABLE IF NOT EXISTS sessions_creneaux (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    heure_debut     TIME NOT NULL,
    heure_fin       TIME NOT NULL,
    intervenant     TEXT,
    ordre           INT NOT NULL DEFAULT 0
);

-- ── Inscriptions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    stagiaire_id    UUID NOT NULL REFERENCES stagiaires(id) ON DELETE CASCADE,
    statut          TEXT NOT NULL CHECK (statut IN ('inscrit','confirme','liste_attente','annule')) DEFAULT 'inscrit',
    presence        BOOLEAN,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, stagiaire_id)
);

-- ── Réponses aux questionnaires (pré/post) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS questionnaire_reponses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    stagiaire_id    UUID NOT NULL REFERENCES stagiaires(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('pre','post')),
    questions       JSONB NOT NULL,  -- [{id, enonce, options, reponse, moduleId}]
    reponses        JSONB NOT NULL,  -- {questionId: 'A'|'B'|'C'|'D'}
    score           INT NOT NULL,
    date_passation  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, stagiaire_id, type)
);

-- ── Enquêtes de satisfaction ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquetes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    stagiaire_id    UUID NOT NULL REFERENCES stagiaires(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('chaud','froid')),
    token           TEXT UNIQUE,    -- token unique pour lien email
    reponses        JSONB NOT NULL DEFAULT '{}',
    date_reponse    TIMESTAMPTZ,
    UNIQUE (session_id, stagiaire_id, type)
);

-- ── Emails envoyés / planifiés ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emails_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
    stagiaire_id    UUID REFERENCES stagiaires(id) ON DELETE SET NULL,
    type            TEXT NOT NULL,  -- convocation, enquete_chaud, enquete_froid, rappel_reponse
    destinataire    TEXT NOT NULL,
    sujet           TEXT NOT NULL,
    statut          TEXT NOT NULL CHECK (statut IN ('planifie','envoyé','erreur')) DEFAULT 'planifie',
    envoye_at       TIMESTAMPTZ,
    planifie_at     TIMESTAMPTZ,
    resend_id       TEXT,
    erreur          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Factures ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS factures (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
    entreprise_id   UUID REFERENCES entreprises(id) ON DELETE SET NULL,
    numero          TEXT UNIQUE NOT NULL,  -- FAC-2026-0001
    type            TEXT NOT NULL CHECK (type IN ('facture','avoir','acompte')) DEFAULT 'facture',
    lignes          JSONB NOT NULL,  -- [{intitule, qte, prix_ht, tva_pct}]
    total_ht        NUMERIC(10,2) NOT NULL,
    total_tva       NUMERIC(10,2) NOT NULL,
    total_ttc       NUMERIC(10,2) NOT NULL,
    opco_nom        TEXT,
    opco_montant    NUMERIC(10,2),
    statut          TEXT NOT NULL CHECK (statut IN ('brouillon','emise','payee','annulee')) DEFAULT 'brouillon',
    date_emission   DATE,
    date_echeance   DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS factures_seq START 1;

-- ── Paramètres applicatifs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parametres (
    cle        TEXT PRIMARY KEY,
    valeur     TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rattrapage pour les bases déjà créées sans la colonne (init_schema rejoue le fichier)
ALTER TABLE parametres ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

INSERT INTO parametres (cle, valeur) VALUES
    ('of_nom',        'PENNYLANE'),
    ('of_siret',      '88026592100044'),
    ('of_adresse',    '2 RUE JULES LEFEBVRE 75009 PARIS'),
    ('of_da',         '28 50 01542 50'),
    ('of_signataire', 'Jonathan Knaus'),
    ('of_titre',      'Team Lead Accounting Firm Services'),
    ('from_email',    'afs-training@pennylane.com'),
    ('tpl_convocation_sujet',    'Convocation — {{session_titre}}'),
    ('tpl_convocation_corps',    'Bonjour {{prenom}},\n\nVous êtes convoqué(e) à la formation "{{session_titre}}" le {{date}}.\n\nCordialement,\nL''équipe AFS Pennylane'),
    ('tpl_enquete_chaud_sujet',  'Votre avis sur la formation — {{session_titre}}'),
    ('tpl_enquete_froid_sujet',  'Retour à froid — {{session_titre}}'),
    ('tpl_rappel_sujet',         'Rappel : questionnaire en attente — {{session_titre}}')
ON CONFLICT (cle) DO NOTHING;

-- ── Index utiles ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inscriptions_session   ON inscriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_stagiaire ON inscriptions(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_sessions_statut        ON sessions(statut);
CREATE INDEX IF NOT EXISTS idx_emails_planifie        ON emails_log(planifie_at) WHERE statut = 'planifie';
CREATE INDEX IF NOT EXISTS idx_stagiaires_entreprise  ON stagiaires(entreprise_id);
