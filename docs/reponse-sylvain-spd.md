# Réponse à Sylvain — SPD CONNECT SMARTOF <> PENNYLANE

**Où** : canal `#portal-request-connect-smartof-pennylane-1148`, en réponse à son message du
2026-10-05 11h59.
**Langue** : rédigé en anglais, comme son message. Dis-moi si tu préfères le français.

> ⚠️ Rien n'est envoyé. À relire, ajuster, puis poster toi-même.

---

Hi Sylvain, thanks for the clear requirements. Straight answers, including where we fall short.

**1. Credentials delivering must pass through IT Tickets — ❌ not met.**

The credentials reached me through **two emails from the vendor (marie.tardivel@smartof.tech) on
11 June 2026**, so the prescribed delivery process wasn't followed.

To be clear on the risk level: they landed in our corporate mailbox, which is a controlled and
protected environment — I have no reason to believe they were exposed on our side. The gap is about
**process and traceability**, not a suspected compromise. What we can't vouch for is the vendor's
own sending mailbox, which is outside our control.

Proposed remediation — happy to follow your preference:

- ask the vendor to **issue a fresh password**, and have it delivered **through an IT ticket**.
  Rotating isn't about fixing an incident: it's simply the cleanest way to get a traced delivery,
  since a ticket has to carry something;
- **remove the two original emails** once the new credentials are in place;
- alternatively, if you consider the existing credentials fine as they are, I can simply register
  them through a ticket for traceability. Your call.

Happy to open the ticket myself — just tell me which queue.

**2. API key scopes must follow the principle of least privileges — ❌ not met.**

I mapped the vendor's API this week (their official Swagger). The service account
`api-afs-pennylane@smartof.tech` currently has **full write access**: `create`, `update` and
**`delete`** on learners, client contacts, trainers, companies, commercial opportunities and
products — plus inscription creation and open-session updates.

**Our intended use is read-only** — pulling reference data to avoid double entry. The delete
scope on learner and trainer records is well beyond what we need.

I'll ask the vendor to either restrict this account to read-only, or issue a separate read-only
account. I'll come back to you with their answer. In the meantime, on our side the tooling I built
enforces a **whitelist of the 16 read endpoints** and refuses any `create`/`update`/`delete` call
by construction.

**3. API keys must be stored in a secure way — 🟡 in progress.**

The key and password are now stored in the **macOS keychain** (encrypted, unlocked by my session)
and are never written to disk, to a file, to shell history or to any repository. The scripts read
them from the keychain at runtime.

Remaining to do: put them in the **company vault** as the source of truth, the keychain being only
a local cache. Tell me which vault you want me to use and I'll move them there.

**Current status, for context:** nothing is in production. This is an exploration phase to find
out what the API actually exposes — so far read-only calls, no data written anywhere, and no
personal data persisted. I'll come back to you before anything moves towards production.

---
---

# ⬇️ Pour toi, à ne pas envoyer

## Pourquoi je te fais répondre « non » deux fois

Parce que c'est vrai, et parce que Sylvain le découvrira de toute façon en instruisant le SPD.
Annoncer les écarts soi-même, avec un plan de remédiation, te place en position de quelqu'un qui
maîtrise son sujet. Les minimiser t'exposerait à ce qu'ils ressortent plus tard, et là ce serait
un problème de confiance, plus seulement de sécurité.

Tu n'es pas en faute, d'ailleurs : c'est l'éditeur qui a envoyé des identifiants par mail. C'est
une pratique courante et c'est précisément ce que la règle vise à corriger.

## Sur la sécurité de nos boîtes mail

Tu as raison et j'avais exagéré : nos messageries sont protégées, et parler d'un secret
« exposé » était excessif. J'ai retiré cette formulation.

L'écart qui subsiste est différent, et il est factuel : **le processus prescrit n'a pas été suivi**.
L'exigence de Sylvain ne porte pas sur la solidité du mail, elle porte sur la **traçabilité du
cycle de vie du secret** — qui le détient, depuis quand, quand il a été renouvelé. Un ticket IT
crée cette trace ; un mail, non. C'est vrai même avec une messagerie irréprochable.

Deux points restent valables :

- **la boîte d'envoi de l'éditeur** n'est pas sous notre contrôle, et la sécurité de la nôtre n'en
  dit rien ;
- le secret existe aujourd'hui en plusieurs copies (leur boîte, la tienne, ton trousseau), ce qui
  complique sa rotation le jour où il faudra la faire.

C'est pour ça que le message propose la rotation **comme véhicule de mise en conformité**, pas
comme réparation d'un incident — et laisse explicitement à Sylvain l'option de valider les
identifiants actuels en les enregistrant simplement via un ticket. Un argument juste tiendra mieux
qu'un argument exagéré.

## Si le mot de passe est renouvelé

**Pense à mettre à jour le trousseau**, sinon les scripts s'arrêteront de fonctionner. La commande
est `./identifiants.sh enregistrer`.

## Ce que tu peux attendre comme réaction

Sylvain devrait valider l'approche : tu réponds aux trois points, tu proposes la remédiation, et
tu signales que rien n'est en production. Il te demandera probablement le numéro du ticket IT et
le nom du coffre. Ce sont des questions auxquelles tu sais répondre.

S'il demande des détails techniques sur les scopes, la liste complète des routes est dans
[smartof-api.md](smartof-api.md), section 3.
