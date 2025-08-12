import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging"

const firebaseConfig = {
  apiKey: "AIzaSyDfwB0dOlR86iQfVzZTuO1G0jYoI6ZTMfY",
  authDomain: "gamesync-0212.firebaseapp.com",
  projectId: "gamesync-0212",
  storageBucket: "gamesync-0212.firebasestorage.app",
  messagingSenderId: "551919197948",
  appId: "1:551919197948:web:cb8eaca23e4596c3008179",
  measurementId: "G-EE1FWZ9B9M"
}

let messagingPromise: Promise<import("firebase/messaging").Messaging> | null = null

export async function ensureMessaging() {
  if (!(await isSupported())) throw new Error("FCM not supported in this browser")
  if (!messagingPromise) {
    const app = initializeApp(firebaseConfig)
    messagingPromise = Promise.resolve(getMessaging(app))
  }
  return messagingPromise
}

export async function requestFcmToken(vapidKey: string): Promise<string | null> {
  try {
    const messaging = await ensureMessaging()
    // register SW explicitly
    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg })
    return token || null
  } catch (e) {
    return null
  }
}

export async function onForegroundMessage(handler: (payload: any) => void) {
  const messaging = await ensureMessaging()
  onMessage(messaging, handler)
}


