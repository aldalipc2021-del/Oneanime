import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// Firebase configuration - these are client-side keys designed for public use
// They are protected by Firebase Security Rules and domain restrictions
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBYNwHEfwyQTwKb7LLfGYhXTqrmZekM_-o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "oneanime-e3849.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "oneanime-e3849",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "oneanime-e3849.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "372585562382",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:372585562382:web:9f38d63c2eccb0bcc5175f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L9SBN0YNGT"
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BOXD_tXemqzYsmKgmLGSet9iOdFuQMn6NRqbMtJSQkR5833b4hU8j805uOgfzHW6-yTgeiTNqPuee7xhhc02Jcw";

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;

export const initializeFirebase = () => {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        messaging = getMessaging(app);
      }
    } catch (error) {
      // Firebase initialization failed - this is expected in some environments
      if (import.meta.env.DEV) {
        console.error("Error initializing Firebase:", error);
      }
    }
  }
  return { app, messaging };
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.log("Browser does not support notifications");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    // Initialize Firebase
    initializeFirebase();

    // Register service worker if available
    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      } catch (swError) {
        console.warn("Service Worker registration failed:", swError);
        // Continue without service worker - foreground notifications will still work
      }
    }

    // Get FCM token
    const { messaging } = initializeFirebase();
    if (!messaging) {
      return null;
    }

    const tokenOptions: any = { vapidKey: VAPID_KEY };
    if (registration) {
      tokenOptions.serviceWorkerRegistration = registration;
    }

    const token = await getToken(messaging, tokenOptions);
    
    return token || null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error getting FCM token:", error);
    }
    return null;
  }
};

export const onMessageListener = () => {
  const { messaging } = initializeFirebase();
  if (!messaging) return Promise.resolve(null);

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};
