import "server-only";

import { createSign } from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3";
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

interface GoogleCalendarConfig {
  enabled: boolean;
  calendarId: string;
  clientEmail: string;
  privateKey: string;
  timezone: string;
}

interface GoogleCalendarEventPayload {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  source?: {
    title: string;
    url: string;
  };
  extendedProperties?: {
    private?: Record<string, string>;
  };
}

interface GoogleCalendarEventResponse {
  id?: string;
  htmlLink?: string;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signJwt(payload: Record<string, string | number>, privateKey: string) {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload)
  )}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${unsignedToken}.${signature}`;
}

function getGoogleCalendarConfig(): GoogleCalendarConfig {
  const enabled = process.env.GOOGLE_CALENDAR_ENABLED === "true";
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "";
  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL ?? "";
  const privateKey = (process.env.GOOGLE_CALENDAR_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  const timezone = process.env.GOOGLE_CALENDAR_TIMEZONE ?? "America/Sao_Paulo";

  return {
    enabled,
    calendarId,
    clientEmail,
    privateKey,
    timezone
  };
}

export function isGoogleCalendarSyncEnabled() {
  const config = getGoogleCalendarConfig();

  return Boolean(config.enabled && config.calendarId && config.clientEmail && config.privateKey);
}

async function getGoogleAccessToken() {
  const config = getGoogleCalendarConfig();

  if (!isGoogleCalendarSyncEnabled()) {
    throw new Error("Google Calendar nao esta configurado.");
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    {
      iss: config.clientEmail,
      scope: GOOGLE_CALENDAR_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now
    },
    config.privateKey
  );

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha ao autenticar no Google Calendar: ${errorBody}`);
  }

  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

async function googleCalendarFetch<TResponse>(
  path: string,
  init: RequestInit = {}
): Promise<TResponse> {
  const config = getGoogleCalendarConfig();
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_URL}/calendars/${encodeURIComponent(config.calendarId)}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha na API do Google Calendar: ${errorBody}`);
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  return (await response.json()) as TResponse;
}

export function buildGoogleCalendarDateTime(rawDate: string, rawTime: string) {
  return `${rawDate}T${rawTime}:00`;
}

export function getGoogleCalendarTimezone() {
  return getGoogleCalendarConfig().timezone;
}

export async function createGoogleCalendarEvent(payload: GoogleCalendarEventPayload) {
  return googleCalendarFetch<GoogleCalendarEventResponse>("/events", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateGoogleCalendarEvent(
  eventId: string,
  payload: GoogleCalendarEventPayload
) {
  return googleCalendarFetch<GoogleCalendarEventResponse>(`/events/${encodeURIComponent(eventId)}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  return googleCalendarFetch(`/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE"
  });
}
