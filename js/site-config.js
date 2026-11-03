/**
 * GAVIOLI 2.0 — configuração PÚBLICA.
 * A chave "apiKey" do Firebase é um identificador público, não senha.
 * NUNCA inclua service accounts, tokens privados ou senhas aqui.
 */
export const SITE = Object.freeze({
  canonicalUrl: 'https://diogo-netto.github.io/Gavioli-guia-trilhas/',
  whatsappNumber: '', // Ex.: 5532999999999; configure APÓS confirmação do Pedro.
  instagramUsername: '', // Ex.: nome.do.perfil, sem @.
  gaMeasurementId: '' // Ex.: G-XXXXXXXXXX; opcional, só inicia após consentimento.
});

export const FIREBASE = Object.freeze({
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  appId: ''
});

export const ADMIN_UID = ''; // Mesmo UID autorizado nas regras, nunca senha.
export const FIREBASE_ENABLED = Boolean(FIREBASE.apiKey && FIREBASE.authDomain && FIREBASE.projectId && FIREBASE.appId);
export const STORAGE_ENABLED = FIREBASE_ENABLED && Boolean(FIREBASE.storageBucket);
