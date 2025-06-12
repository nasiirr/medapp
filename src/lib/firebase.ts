
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// Explicitly check for projectId as it's crucial
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  // This error will be thrown before Firebase SDK gets a chance, making it clearer.
  throw new Error(
    "Firebase Configuration Error: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' is not set in your environment variables. " +
    "This is crucial for Firebase to identify your project and for the Realtime Database to function. " +
    "Please ensure it is correctly set in your environment."
  );
}

// databaseURL can often be inferred if projectId is correct and database is in default location.
// However, if it's explicitly set to an empty string, it can cause issues.
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
if (databaseURL === "") { // Check for explicitly empty string
    console.warn(
        "Firebase Configuration Warning: 'NEXT_PUBLIC_FIREBASE_DATABASE_URL' is set to an empty string. " +
        "If you intend to use a specific database URL, ensure it's correct. " +
        "If you want Firebase to infer it from projectId, ensure this variable is not set (i.e., undefined), rather than an empty string."
    );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // Pass databaseURL as is; if undefined, Firebase attempts to infer it.
  // If it's an empty string, it might lead to issues, hence the warning above.
  databaseURL: databaseURL,
  projectId: projectId, // Already checked for existence
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId is optional for RTDB, provide undefined if not set to avoid issues with empty strings
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

// Check for other potentially critical values for general Firebase app functionality
if (!firebaseConfig.apiKey) {
  // This might not break getDatabase immediately but will break other services like Auth.
  console.warn("Firebase Configuration Warning: 'NEXT_PUBLIC_FIREBASE_API_KEY' is not set. This may cause issues with other Firebase services like Authentication.");
}


let app: FirebaseApp;
let database: Database;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e:any) {
     const initErrorMessage = `Firebase initialization failed: ${e.message}. 
Please verify your Firebase configuration environment variables:
- NEXT_PUBLIC_FIREBASE_API_KEY: ${firebaseConfig.apiKey ? 'Set' : 'MISSING/Invalid'}
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${firebaseConfig.authDomain ? 'Set' : 'MISSING/Invalid'}
- NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${firebaseConfig.projectId} (Checked)
- NEXT_PUBLIC_FIREBASE_DATABASE_URL: ${firebaseConfig.databaseURL || 'Not set (Firebase will attempt to infer)'}
- NEXT_PUBLIC_FIREBASE_APP_ID: ${firebaseConfig.appId ? 'Set' : 'MISSING/Invalid'}
Ensure these are correctly configured in your environment.`;
    console.error(initErrorMessage);
    throw new Error(initErrorMessage);
  }
} else {
  app = getApps()[0];
}

// The original error happens at getDatabase.
// If the new projectId check doesn't catch the issue,
// it means projectId is set, but getDatabase still fails.
// This could be due to an incorrect projectId, an incorrectly set databaseURL,
// or the database not being provisioned in the project.
try {
  database = getDatabase(app);
} catch (error) {
    let message = `Firebase getDatabase Error: ${(error as Error).message}. `;
    message += `Project ID used: '${projectId}'. `;
    if (databaseURL) {
        message += `Database URL provided: '${databaseURL}'. Please ensure this is correct if set explicitly. `;
    } else {
        message += `Database URL was not explicitly provided; Firebase attempted to infer it from the Project ID. `;
    }
    message += `
Common causes for this error:
1. The Project ID ('${projectId}') might be incorrect or does not match a valid Firebase project.
2. If 'NEXT_PUBLIC_FIREBASE_DATABASE_URL' is set, its value might be incorrect.
3. The Realtime Database might not be enabled/created for this Firebase project ('${projectId}'). You can check this in the Firebase console under "Build" > "Realtime Database".
4. If your database is not in the default us-central1 region, you might need to explicitly set the 'NEXT_PUBLIC_FIREBASE_DATABASE_URL'.

Please verify your Firebase project settings and environment variable configuration.`;
    console.error(message);
    throw new Error(message);
}

export { app, database };
