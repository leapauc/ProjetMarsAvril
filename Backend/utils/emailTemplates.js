const baseTemplate = (content) => `
<div style="margin:0;padding:0;background:#07071a;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07071a;">
    <tr>
      <td align="center" style="margin:0;padding:0;">

        <!-- CONTAINER -->
        <table width="600" cellpadding="0" cellspacing="0" style="border-radius:20px;overflow:hidden;background:#0d0d24;border:1px solid rgba(255,255,255,0.08);margin:0;">

          <!-- HERO HEADER -->
          <tr>
            <td style="
              position:relative;
              background:#0d0d24;
              text-align:center;
              padding:40px 20px 30px 20px;
            ">

              <!-- ORBS -->
              <div style="
                position:absolute;
                width:250px;
                height:250px;
                background:radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%);
              "></div>

              <div style="
                position:absolute;
                width:250px;
                height:250px;
                background:radial-gradient(circle, rgba(6,182,212,0.25), transparent 70%);
              "></div>

              <!-- TAG -->
              <div style="
                display:inline-block;
                padding:6px 14px;
                border-radius:999px;
                background:rgba(124,58,237,0.15);
                color:#7c3aed;
                font-size:12px;
                font-weight:bold;
                margin-bottom:12px;
              ">
                🚀 EventFlow Platform
              </div>

              <!-- TITLE -->
              <h1 style="
                margin:0;
                font-size:30px;
                font-weight:800;
                line-height:1.2;
                color:#ffffff;
              ">
                Vivez des événements<br/>
                <span style="color:#06b6d4;">
                  extraordinaires
                </span>
              </h1>

              <!-- SUB -->
              <p style="
                margin:12px 0 0 0;
                font-size:14px;
                color:#94a3b8;
                line-height:1.6;
              ">
                Une expérience moderne pour découvrir et gérer vos événements.
              </p>

            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:25px;">
              <div style="
                background:rgba(255,255,255,0.03);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:14px;
                padding:20px;
                color:#f0f2ff;
                font-size:15px;
                line-height:1.6;
              ">
                ${content}
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="text-align:center;padding:0 25px 25px 25px;">
              <a href="http://localhost:5173/events"
                style="
                  display:inline-block;
                  padding:12px 24px;
                  background:linear-gradient(135deg,#7c3aed,#06b6d4);
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:8px;
                  font-weight:bold;
                ">
                Explorer les événements
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#7c3aed,#4f46e5,#06b6d4);
              padding:18px;
              text-align:center;
              color:#ffffff;
              font-size:12px;
            ">
              © EventFlow<br/>
              <span style="opacity:0.8;">Plateforme d'événements nouvelle génération</span>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</div>
`;

const registerTemplate = (name, event) =>
  baseTemplate(`
    <p>Bonjour <strong>${name}</strong>,</p>

    <p>Vous êtes inscrit à l'événement :</p>

    <div style="
      margin:20px 0;
      padding:15px;
      border-radius:10px;
      background:rgba(124,58,237,0.15);
      border:1px solid rgba(124,58,237,0.3);
    ">
      🎟️ <strong>${event}</strong>
    </div>

    <p>Votre demande est en attente de validation.</p>

    <div style="text-align:center;margin-top:25px;">
      <a href="http://localhost:5173/events"
        style="
          display:inline-block;
          padding:12px 22px;
          background:linear-gradient(135deg,#7c3aed,#06b6d4);
          color:#ffffff;
          text-decoration:none;
          border-radius:8px;
          font-weight:bold;
        ">
        Voir mes événements
      </a>
    </div>
  `);

const statusTemplate = (name, event, status) =>
  baseTemplate(`
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Votre inscription à :</p>
    <p style="margin:20px 0;padding:12px;background:${status === "confirmed" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"};border-radius:8px;">
      ${status === "confirmed" ? "✅" : "❌"} <strong>${event}</strong>
    </p>
    <p>a été <strong>${status === "confirmed" ? "validée" : "refusée"}</strong>.</p>
  `);

const cancelTemplate = (name, event) =>
  baseTemplate(`
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Votre inscription à :</p>
    <p style="margin:20px 0;padding:12px;background:rgba(239,68,68,0.15);border-radius:8px;">
      ❌ <strong>${event}</strong>
    </p>
    <p>a bien été annulée.</p>
  `);

module.exports = {
  registerTemplate,
  statusTemplate,
  cancelTemplate,
};
