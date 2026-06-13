"""Génération de PDF à partir du HTML d'un document (convocation / attestation).

Utilise WeasyPrint si disponible. La dépendance système (libpango, etc.) n'est
pas toujours présente : en cas d'absence, html_to_pdf renvoie None et l'appelant
envoie alors l'email sans pièce jointe (dégradation gracieuse, jamais d'échec dur).
"""
import logging

logger = logging.getLogger(__name__)

_weasyprint = None
_checked = False


def _get_weasyprint():
    global _weasyprint, _checked
    if not _checked:
        _checked = True
        try:
            import weasyprint
            _weasyprint = weasyprint
        except Exception as e:  # ImportError ou lib système manquante
            logger.warning(f"WeasyPrint indisponible, PDF désactivé : {e}")
            _weasyprint = None
    return _weasyprint


def pdf_disponible() -> bool:
    return _get_weasyprint() is not None


def html_to_pdf(html: str) -> bytes | None:
    """Rend le HTML en PDF (bytes). Renvoie None si la génération est impossible."""
    wp = _get_weasyprint()
    if wp is None:
        return None
    try:
        return wp.HTML(string=html).write_pdf()
    except Exception as e:
        logger.error(f"Échec génération PDF : {e}")
        return None
