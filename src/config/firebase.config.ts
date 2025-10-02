// Firebase Configuration
// You need to get these values from Firebase Console: https://console.firebase.google.com/

export const FIREBASE_CONFIG = {
  // These values come from your Firebase project settings
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abcdef123456789",
  
  // Google Sign-In Web Client ID (from Firebase Console -> Authentication -> Sign-in method -> Google)
  googleWebClientId: "your-web-client-id.apps.googleusercontent.com",
};

// Instructions to set up Firebase:
// 
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Create a new project or select existing one
// 3. Add your Android/iOS app to the project
// 4. Download configuration files:
//    - For Android: google-services.json (place in android/app/)
//    - For iOS: GoogleService-Info.plist (place in ios/)
// 5. Enable Authentication -> Sign-in method -> Google
// 6. Copy the Web Client ID from Google provider settings
// 7. Update the values above with your actual Firebase project values