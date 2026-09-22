import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";

const DEFAULT_COORDINATOR_EMAILS = ["stekel@ifsp.edu.br"];
const SETTINGS_COLLECTION = "configuracoes";
const SETTINGS_DOC = "acesso";

// ─── Unified cache for the single Firestore document ─────────────────────────
interface AccessDoc {
  coordinatorEmails: string[];
  accessSettings: AccessSettings;
  notificationRecipientEmails: string[];
}

export interface AccessSettings {
  allowStudents: boolean;
  allowExternalUsers: boolean;
}

const CACHE_TTL_MS = 60_000;
let cachedDoc: AccessDoc | null = null;
let cachedAt = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseEnvCoordinatorEmails() {
  return (process.env.COORDINATOR_EMAILS ?? "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function normalizeEmailList(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((email) => (typeof email === "string" ? normalizeEmail(email) : ""))
        .filter(Boolean)
    : [];
}

// ─── Core: single Firestore read, cached ─────────────────────────────────────
async function loadAccessDoc(options?: { fresh?: boolean }): Promise<AccessDoc> {
  if (!options?.fresh && cachedDoc && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedDoc;
  }

  const snapshot = await getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC)
    .get();

  const data = snapshot.data();
  const defaults = [...DEFAULT_COORDINATOR_EMAILS, ...parseEnvCoordinatorEmails()];
  const storedEmails = normalizeEmailList(data?.coordinatorEmails);

  const coordinatorEmails = [...new Set([...defaults, ...storedEmails])].sort((a, b) =>
    a.localeCompare(b)
  );

  const allRecipients = normalizeEmailList(data?.notificationRecipientEmails).filter(
    (email) => coordinatorEmails.includes(email)
  );

  cachedDoc = {
    coordinatorEmails,
    accessSettings: {
      allowStudents: Boolean(data?.allowStudents),
      allowExternalUsers: Boolean(data?.allowExternalUsers)
    },
    notificationRecipientEmails:
      allRecipients.length > 0
        ? [...new Set(allRecipients)].sort((a, b) => a.localeCompare(b))
        : coordinatorEmails
  };
  cachedAt = Date.now();

  return cachedDoc;
}

export function invalidateAccessCache() {
  cachedDoc = null;
  cachedAt = 0;
}

/** @deprecated use invalidateAccessCache instead */
export const invalidateCoordinatorCache = invalidateAccessCache;
/** @deprecated use invalidateAccessCache instead */
export const invalidateAccessSettingsCache = invalidateAccessCache;

// ─── Email type checks (sync, no Firestore) ──────────────────────────────────
export function isPrimaryIfspEmail(email?: string | null) {
  if (!email) return false;
  return /^[^@]+@ifsp\.edu\.br$/i.test(email);
}

export function isIfspFamilyEmail(email?: string | null) {
  if (!email) return false;
  return /^[^@]+@(?:[a-z0-9-]+\.)*ifsp\.edu\.br$/i.test(email);
}

export function isStudentEmail(email?: string | null) {
  if (!email) return false;
  return /^[^@]+@aluno\.ifsp\.edu\.br$/i.test(email);
}

// ─── Coordinator emails ───────────────────────────────────────────────────────
export async function getCoordinatorEmails() {
  return (await loadAccessDoc()).coordinatorEmails;
}

export async function getNotificationRecipientEmails() {
  return (await loadAccessDoc()).notificationRecipientEmails;
}

export async function isCoordinatorEmail(email?: string | null) {
  if (!email) return false;
  const emails = await getCoordinatorEmails();
  return emails.includes(normalizeEmail(email));
}

// ─── Access settings ─────────────────────────────────────────────────────────
export async function getAccessSettings(): Promise<AccessSettings> {
  return (await loadAccessDoc()).accessSettings;
}

export async function setAccessSettings(settings: Partial<AccessSettings>) {
  await getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC)
    .set({ ...settings, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  invalidateAccessCache();
}

// ─── Login authorization ──────────────────────────────────────────────────────
export async function isAllowedLoginEmail(email?: string | null) {
  if (!email) return false;

  // Leitura sem cache de proposito. O cache de 60s vive na memoria de UMA
  // instancia serverless, entao invalidateAccessCache() nao alcanca as demais:
  // um coordenador recem-adicionado poderia ficar ate 1 minuto sem conseguir
  // entrar, dependendo de qual instancia atendesse o login. Login e raro e e o
  // ponto onde errar custa caro, entao aqui vale pagar 1 leitura do Firestore.
  // A leitura repopula o cache, entao as requisicoes seguintes seguem baratas.
  const { accessSettings, coordinatorEmails } = await loadAccessDoc({ fresh: true });

  if (accessSettings.allowExternalUsers) return true;
  if (isPrimaryIfspEmail(email)) return true;
  if (accessSettings.allowStudents && isStudentEmail(email)) return true;

  // usa a lista ja lida acima; isCoordinatorEmail() voltaria a passar pelo cache
  return coordinatorEmails.includes(normalizeEmail(email));
}

// ─── Coordinator CRUD ─────────────────────────────────────────────────────────
export async function addCoordinatorEmail(email: string) {
  const normalized = normalizeEmail(email);

  // Sem cache: isto e um read-modify-write. Partir de um cache velho desta
  // instancia gravaria uma lista sem o que outra instancia acabou de incluir,
  // apagando o coordenador dela.
  const current = await loadAccessDoc({ fresh: true });

  const nextEmails = [...new Set([...current.coordinatorEmails, normalized])].sort(
    (a, b) => a.localeCompare(b)
  );
  const nextRecipients = [...new Set([...current.notificationRecipientEmails, normalized])].sort(
    (a, b) => a.localeCompare(b)
  );

  await getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC)
    .set(
      {
        coordinatorEmails: nextEmails,
        notificationRecipientEmails: nextRecipients,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  invalidateAccessCache();
  return nextEmails;
}

export async function removeCoordinatorEmail(email: string) {
  const normalized = normalizeEmail(email);

  // sem cache pelo mesmo motivo de addCoordinatorEmail
  const current = await loadAccessDoc({ fresh: true });

  const nextEmails = current.coordinatorEmails.filter(
    (e) => e !== normalized || DEFAULT_COORDINATOR_EMAILS.includes(e)
  );
  const nextRecipients = current.notificationRecipientEmails.filter(
    (e) => e !== normalized || nextEmails.includes(e)
  );

  await getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC)
    .set(
      {
        coordinatorEmails: nextEmails,
        notificationRecipientEmails: nextRecipients,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  invalidateAccessCache();
  return nextEmails;
}

export async function setNotificationRecipientEmails(emails: string[]) {
  const normalizedEmails = [...new Set(emails.map((e) => normalizeEmail(e)).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  );

  if (normalizedEmails.length === 0) {
    throw new Error("Selecione pelo menos um coordenador para receber os avisos.");
  }

  // sem cache: valida contra a lista real, nao contra uma copia de ate 60s atras
  const { coordinatorEmails } = await loadAccessDoc({ fresh: true });
  const invalidEmails = normalizedEmails.filter((e) => !coordinatorEmails.includes(e));

  if (invalidEmails.length > 0) {
    throw new Error("A lista de notificacao deve conter apenas coordenadores cadastrados.");
  }

  await getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC)
    .set(
      { notificationRecipientEmails: normalizedEmails, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

  invalidateAccessCache();
  return normalizedEmails;
}
