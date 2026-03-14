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
async function loadAccessDoc(): Promise<AccessDoc> {
  if (cachedDoc && Date.now() - cachedAt < CACHE_TTL_MS) {
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

  const { accessSettings } = await loadAccessDoc();

  if (accessSettings.allowExternalUsers) return true;
  if (isPrimaryIfspEmail(email)) return true;
  if (accessSettings.allowStudents && isStudentEmail(email)) return true;

  return isCoordinatorEmail(email);
}

// ─── Coordinator CRUD ─────────────────────────────────────────────────────────
export async function addCoordinatorEmail(email: string) {
  const normalized = normalizeEmail(email);

  const nextEmails = [...new Set([...(await getCoordinatorEmails()), normalized])].sort(
    (a, b) => a.localeCompare(b)
  );
  const nextRecipients = [...new Set([...(await getNotificationRecipientEmails()), normalized])].sort(
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
  const nextEmails = (await getCoordinatorEmails()).filter(
    (e) => e !== normalized || DEFAULT_COORDINATOR_EMAILS.includes(e)
  );
  const nextRecipients = (await getNotificationRecipientEmails()).filter(
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

  const coordinatorEmails = await getCoordinatorEmails();
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
