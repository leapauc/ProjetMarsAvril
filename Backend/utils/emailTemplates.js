/* ─── Couleurs calquées sur style.css ─────────────────────────────────────── */
const C = {
  bg:      '#07071a',
  surface: '#0d0d24',
  card:    '#12122a',
  border:  'rgba(255,255,255,0.08)',
  text:    '#f0f2ff',
  text2:   '#94a3b8',
  primary: '#7c3aed',
  accent:  '#06b6d4',
  ok:      '#10b981',
  err:     '#ef4444',
  warn:    '#f59e0b',
}

/* ─── Layout de base ──────────────────────────────────────────────────────── */
const baseTemplate = ({ title, subtitle, icon, accentColor, ctaLabel, ctaUrl, content }) => `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px;">
    <tr>
      <td align="center">

        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${C.surface};border-radius:16px;border:1px solid ${C.border};overflow:hidden;">

          <!-- HEADER BANDE GRADIENT -->
          <tr>
            <td style="background:linear-gradient(135deg,${C.primary} 0%,#4f46e5 50%,${C.accent} 100%);padding:4px 0;"></td>
          </tr>

          <!-- LOGO + ICONE -->
          <tr>
            <td align="center" style="padding:36px 32px 24px 32px;">
              <!-- Logo -->
              <div style="margin-bottom:24px;">
                <span style="font-size:20px;">⚡</span>
                <span style="font-size:18px;font-weight:800;background:linear-gradient(135deg,${C.primary},${C.accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.03em;vertical-align:middle;margin-left:6px;">EventFlow</span>
              </div>
              <!-- Icone action -->
              <div style="width:56px;height:56px;border-radius:50%;background:${accentColor}22;border:1px solid ${accentColor}44;display:inline-flex;align-items:center;justify-content:center;font-size:26px;line-height:56px;margin-bottom:20px;">${icon}</div>
              <!-- Titre -->
              <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:${C.text};line-height:1.3;">${title}</h1>
              <!-- Sous-titre -->
              <p style="margin:0;font-size:14px;color:${C.text2};line-height:1.5;">${subtitle}</p>
            </td>
          </tr>

          <!-- SEPARATEUR -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:${C.border};"></div></td></tr>

          <!-- CONTENU -->
          <tr>
            <td style="padding:28px 32px;color:${C.text};font-size:15px;line-height:1.7;">
              ${content}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:4px 32px 36px 32px;">
              <a href="${ctaUrl}" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,${C.primary},${C.accent});color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.01em;">${ctaLabel}</a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:${C.card};border-top:1px solid ${C.border};padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${C.text2};">© ${new Date().getFullYear()} <strong style="color:${C.text};">EventFlow</strong> · Plateforme d'événements nouvelle génération</p>
              <p style="margin:6px 0 0 0;font-size:11px;color:rgba(148,163,184,0.6);">Vous recevez cet email car vous êtes inscrit sur EventFlow.</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`

/* ─── Bloc "événement" réutilisable ───────────────────────────────────────── */
const eventBlock = (eventName, color = C.primary) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:${color}18;border:1px solid ${color}33;border-left:3px solid ${color};border-radius:8px;padding:14px 16px;">
        <span style="font-size:14px;font-weight:700;color:${C.text};">🎟️ ${eventName}</span>
      </td>
    </tr>
  </table>`

/* ─── Templates ───────────────────────────────────────────────────────────── */
const registerTemplate = (name, eventName) =>
  baseTemplate({
    icon:        '📬',
    accentColor: C.warn,
    title:       'Inscription enregistrée',
    subtitle:    'Votre demande a bien été reçue',
    ctaLabel:    'Voir mes inscriptions',
    ctaUrl:      'http://localhost:5174/dashboard',
    content: `
      <p style="margin:0 0 4px 0;">Bonjour <strong>${name}</strong>,</p>
      <p style="margin:0 0 16px 0;color:${C.text2};">Votre demande d'inscription à l'événement suivant a bien été enregistrée :</p>
      ${eventBlock(eventName, C.primary)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0;">
        <tr>
          <td style="background:${C.warn}15;border:1px solid ${C.warn}30;border-radius:8px;padding:12px 16px;">
            <span style="font-size:13px;color:${C.warn};font-weight:600;">⏳ En attente de validation par l'organisateur</span>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0 0;font-size:13px;color:${C.text2};">Vous serez notifié par email dès que votre inscription sera traitée.</p>
    `,
  })

const statusTemplate = (name, eventName, status) => {
  const confirmed = status === 'confirmed'
  return baseTemplate({
    icon:        confirmed ? '✅' : '❌',
    accentColor: confirmed ? C.ok : C.err,
    title:       confirmed ? 'Inscription validée !' : 'Inscription refusée',
    subtitle:    confirmed ? 'Bonne nouvelle, vous êtes confirmé(e)' : 'L\'organisateur n\'a pas pu vous accepter',
    ctaLabel:    confirmed ? 'Voir l\'événement' : 'Découvrir d\'autres événements',
    ctaUrl:      'http://localhost:5174/events',
    content: `
      <p style="margin:0 0 4px 0;">Bonjour <strong>${name}</strong>,</p>
      <p style="margin:0 0 16px 0;color:${C.text2};">Votre inscription à l'événement suivant a été <strong>${confirmed ? 'validée' : 'refusée'}</strong> :</p>
      ${eventBlock(eventName, confirmed ? C.ok : C.err)}
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:${confirmed ? C.ok : C.err}15;border:1px solid ${confirmed ? C.ok : C.err}30;border-radius:8px;padding:12px 16px;">
            <span style="font-size:13px;color:${confirmed ? C.ok : C.err};font-weight:600;">${confirmed ? '✅ Votre place est confirmée. À bientôt !' : '❌ Votre demande n\'a pas été retenue cette fois.'}</span>
          </td>
        </tr>
      </table>
    `,
  })
}

const cancelTemplate = (name, eventName) =>
  baseTemplate({
    icon:        '🚫',
    accentColor: C.err,
    title:       'Inscription annulée',
    subtitle:    'Votre désinscription a bien été prise en compte',
    ctaLabel:    'Découvrir d\'autres événements',
    ctaUrl:      'http://localhost:5174/events',
    content: `
      <p style="margin:0 0 4px 0;">Bonjour <strong>${name}</strong>,</p>
      <p style="margin:0 0 16px 0;color:${C.text2};">Votre inscription à l'événement suivant a été annulée :</p>
      ${eventBlock(eventName, C.err)}
      <p style="margin:0;font-size:13px;color:${C.text2};">D'autres événements vous attendent sur la plateforme.</p>
    `,
  })

module.exports = {
  registerTemplate,
  statusTemplate,
  cancelTemplate,
}

