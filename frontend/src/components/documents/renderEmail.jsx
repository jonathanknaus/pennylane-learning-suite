import { renderToStaticMarkup } from 'react-dom/server'
import printCss from './print.css?raw'
import Convocation from './Convocation'
import Attestation from './Attestation'

/**
 * Rend un document (convocation / attestation) en email HTML autonome :
 * le même composant que l'aperçu écran, emballé dans un document HTML complet
 * avec le CSS d'impression inliné pour un rendu correct dans les clients mail.
 */
const COMPONENTS = {
  convocation: Convocation,
  attestation: Attestation,
}

export function renderDocumentEmail(typeDoc, data, stagiaire) {
  const Component = COMPONENTS[typeDoc]
  if (!Component) throw new Error(`Type de document non supporté pour l'email : ${typeDoc}`)

  const body = renderToStaticMarkup(<Component data={data} stagiaire={stagiaire} />)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { margin: 0; padding: 16px; background: #f3f4f6; }
.doc-page { box-shadow: 0 1px 4px rgba(0,0,0,0.08); width: auto; max-width: 800px; min-height: auto; }
.page-break { display: none; }
${printCss}
</style>
</head>
<body>
${body}
</body>
</html>`
}
