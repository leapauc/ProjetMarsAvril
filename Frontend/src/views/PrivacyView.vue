<template>
  <div class="page">
    <div class="container" style="max-width:860px">
      <div class="privacy-hero anim-up">
        <span class="privacy-icon">🔒</span>
        <h1 class="section-title">Politique de confidentialité</h1>
        <p class="section-subtitle">Dernière mise à jour : 31 mars 2026 — Version v1</p>
      </div>

      <div class="privacy-content card">
        <section class="priv-section">
          <h2>1. Qui sommes-nous ?</h2>
          <p>EventFlow est une plateforme de gestion d'événements professionnels. Le responsable du traitement est <strong>EventFlow SAS</strong>, dont le DPO est joignable à l'adresse <a href="mailto:dpo@eventflow.fr" class="priv-link">dpo@eventflow.fr</a>.</p>
        </section>

        <section class="priv-section">
          <h2>2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul>
            <li><strong>Identité :</strong> prénom, nom (obligatoires)</li>
            <li><strong>Contact :</strong> adresse email (obligatoire), téléphone (optionnel)</li>
            <li><strong>Compte :</strong> mot de passe hashé (bcrypt), rôle, date d'inscription</li>
            <li><strong>Consentement :</strong> version acceptée, date d'acceptation</li>
            <li><strong>Technique :</strong> adresse IP pseudonymisée (SHA-256)</li>
          </ul>
        </section>

        <section class="priv-section">
          <h2>3. Finalités et bases légales</h2>
          <table class="priv-table">
            <thead>
              <tr><th>Traitement</th><th>Base légale</th></tr>
            </thead>
            <tbody>
              <tr><td>Gestion de compte utilisateur</td><td>Exécution du contrat</td></tr>
              <tr><td>Inscription aux événements</td><td>Exécution du contrat</td></tr>
              <tr><td>Envoi de notifications</td><td>Intérêt légitime</td></tr>
              <tr><td>Logs d'accès aux données</td><td>Obligation légale (RGPD Art. 30)</td></tr>
              <tr><td>Cookies analytiques</td><td>Consentement</td></tr>
              <tr><td>Cookies marketing</td><td>Consentement</td></tr>
            </tbody>
          </table>
        </section>

        <section class="priv-section">
          <h2>4. Vos droits (RGPD)</h2>
          <div class="rights-grid">
            <div class="right-item">
              <span class="right-icon">👁️</span>
              <div><strong>Droit d'accès</strong><p>Consultez toutes vos données via votre profil.</p></div>
            </div>
            <div class="right-item">
              <span class="right-icon">✏️</span>
              <div><strong>Droit de rectification</strong><p>Modifiez vos informations depuis votre profil.</p></div>
            </div>
            <div class="right-item">
              <span class="right-icon">🗑️</span>
              <div><strong>Droit à l'effacement</strong><p>Anonymisation de votre compte sur demande.</p></div>
            </div>
            <div class="right-item">
              <span class="right-icon">📦</span>
              <div><strong>Droit à la portabilité</strong><p>Export de vos données en JSON ou PDF.</p></div>
            </div>
          </div>
          <p>Pour exercer vos droits : <a href="mailto:dpo@eventflow.fr" class="priv-link">dpo@eventflow.fr</a></p>
        </section>

        <section class="priv-section">
          <h2>5. Durée de conservation</h2>
          <p>Les données sont conservées pendant la durée d'activité du compte. Les comptes inactifs depuis plus de 2 ans sont automatiquement anonymisés. Les logs RGPD sont conservés 5 ans (obligation légale).</p>
        </section>

        <section class="priv-section">
          <h2>6. Sécurité</h2>
          <p>Vos mots de passe sont hachés avec <strong>bcrypt</strong>. Les adresses IP sont pseudonymisées avant stockage. Les accès aux données personnelles sont tracés. Toutes les communications transitent via HTTPS.</p>
        </section>

        <section class="priv-section">
          <h2>7. Cookies</h2>
          <p>Nous utilisons 3 catégories de cookies : essentiels (obligatoires), analytiques et marketing (sur consentement). Vous pouvez modifier vos préférences à tout moment via le bandeau en bas de page.</p>
        </section>

        <section class="priv-section">
          <h2>8. Contact</h2>
          <p>Pour toute question : <a href="mailto:dpo@eventflow.fr" class="priv-link">dpo@eventflow.fr</a><br />
          Vous pouvez également saisir la CNIL : <a href="https://www.cnil.fr" class="priv-link" target="_blank">www.cnil.fr</a></p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.privacy-hero { text-align: center; margin-bottom: 40px; }
.privacy-icon { font-size: 48px; display: block; margin-bottom: 16px; }

.privacy-content { padding: 40px; display: flex; flex-direction: column; gap: 0; }

.priv-section {
  padding: 24px 0;
  border-bottom: 1px solid var(--c-border);
}
.priv-section:last-child { border-bottom: none; }

.priv-section h2 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--c-text);
}
.priv-section p  { color: var(--c-text-2); line-height: 1.7; margin-bottom: 10px; }
.priv-section ul { color: var(--c-text-2); padding-left: 20px; line-height: 2; }
.priv-link { color: var(--c-primary); text-decoration: underline; }

.priv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.priv-table th, .priv-table td {
  padding: 10px 14px;
  border: 1px solid var(--c-border);
  text-align: left;
}
.priv-table th { background: var(--c-card); font-weight: 600; color: var(--c-text); }
.priv-table td { color: var(--c-text-2); }

.rights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.right-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
}
.right-icon { font-size: 22px; flex-shrink: 0; }
.right-item strong { display: block; font-size: 14px; margin-bottom: 4px; }
.right-item p { font-size: 12px; color: var(--c-text-2); margin: 0; }

@media (max-width: 600px) {
  .privacy-content { padding: 24px 20px; }
}
</style>
