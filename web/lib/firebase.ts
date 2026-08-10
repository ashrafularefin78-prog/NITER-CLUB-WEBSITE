"use client";

import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Live values from Firebase → Project settings → Your apps (public by design;
 * real security comes from the rules in ../firebase/). Override any of these
 * with NEXT_PUBLIC_FIREBASE_* env vars when deploying your own project.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB5WPb6bsO9qXSccBHK-mva6gj64YPQ-BE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "niter-club-website.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "niter-club-website",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "niter-club-website.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "385847201496",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:385847201496:web:bacbdc3e681c31d7a6d1ad",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-51ERK1LMZP",
};

export const cloudEnabled =
  typeof window !== "undefined" && !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

function init() {
  if (!cloudEnabled) return;
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  }
}

export function getCloudDb(): Firestore | null {
  init();
  return db;
}

export function getCloudAuth(): Auth | null {
  init();
  return auth;
}

export function getCloudStorage(): FirebaseStorage | null {
  init();
  return storage;
}
