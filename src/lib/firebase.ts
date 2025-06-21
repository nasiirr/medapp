
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

let app: FirebaseApp | null = null;
let database: Database | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// A critical check for the project ID to avoid silent failures.
if (!firebaseConfig.projectId) {
  console.error(
    "Firebase Startup Error: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' is not set in your environment variables. The app cannot connect to Firebase without it. Please add it to your .env file."
  );
} else {
  // Initialize Firebase only if it hasn't been initialized yet.
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
    } catch (e: any) {
      console.error(
        `Firebase initialization failed: ${e.message}. Please check your Firebase project configuration in the .env file.`,
        firebaseConfig
      );
      // Ensure app and database are null if initialization fails.
      app = null;
      database = null;
    }
  } else {
    // If the app is already initialized, just get the instances.
    app = getApps()[0];
    try {
      database = getDatabase(app);
    } catch (e: any) {
      console.error(
        `Firebase getDatabase failed: ${e.message}. This can happen if the database is not enabled in your Firebase project.`
      );
      database = null;
    }
  }
}

export { app, database };
