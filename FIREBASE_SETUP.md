# Firebase Setup Instructions

To run this application, you need to create a Firebase project and get your Firebase configuration.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click on "Add project" and follow the steps to create a new project.

2.  **Get Firebase Configuration:**
    *   In your Firebase project, go to the "Project settings" (click the gear icon next to "Project Overview").
    *   In the "General" tab, under "Your apps", click on the "Web" icon (`</>`).
    *   Give your app a nickname and click on "Register app".
    *   You will see your Firebase configuration object. It looks like this:
        ```javascript
        const firebaseConfig = {
          apiKey: "YOUR_API_KEY",
          authDomain: "YOUR_AUTH_DOMAIN",
          projectId: "YOUR_PROJECT_ID",
          storageBucket: "YOUR_STORAGE_BUCKET",
          messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
          appId: "YOUR_APP_ID",
          measurementId: "YOUR_MEASUREMENT_ID"
        };
        ```
    *   Copy this object and paste it into the `src/lib/firebase.ts` file, replacing the placeholder values.

3.  **Enable Firestore and Authentication:**
    *   In the Firebase Console, go to "Firestore Database" and click on "Create database". Choose "Start in production mode".
    *   Go to "Authentication" and click on "Get started". Enable the "Email/Password" sign-in method.

4.  **Install Dependencies and Run the App:**
    *   Open your terminal in the `photo-fixx` directory.
    *   Run `npm install` to install all the dependencies.
    *   Run `npm run dev` to start the development server.
    *   Open your browser and go to `http://localhost:5173` (or the address shown in your terminal).
