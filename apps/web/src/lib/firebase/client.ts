"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;

function getFirebaseClientConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Firebase client config ausente: ${missing.join(", ")}`);
  }

  return config;
}

function ensureFirebaseClient() {
  if (firebaseApp && firebaseAuth && firebaseDb) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
  }

  const app = getApps().length ? getApp() : initializeApp(getFirebaseClientConfig());
  const auth = getAuth(app);
  const db = getFirestore(app);

  void setPersistence(auth, browserLocalPersistence);

  firebaseApp = app;
  firebaseAuth = auth;
  firebaseDb = db;

  return { app, auth, db };
}

export function getFirebaseApp() {
  return ensureFirebaseClient().app;
}

export function getFirebaseAuth() {
  return ensureFirebaseClient().auth;
}

export function getFirebaseDb() {
  return ensureFirebaseClient().db;
}

/**
 * Creates a fresh GoogleAuthProvider.
 *
 * Sem o parametro `hd`, de proposito. `hd` filtra o seletor de contas do Google
 * e nao autoriza nada: quem decide quem entra e isAllowedLoginEmail() no
 * servidor. Fixar hd:"ifsp.edu.br" impedia um coordenador de dominio externo
 * (ex.: @gmail.com) de ate mesmo selecionar a propria conta, apesar de a lista
 * de coordenadores valer para qualquer dominio. Conta nao autorizada que chegue
 * a autenticar e recusada e deslogada no retorno, com mensagem.
 */
export function getGoogleAuthProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account"
  });
  provider.addScope("email");
  provider.addScope("profile");
  return provider;
}
