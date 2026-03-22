# Knead to Know — Setup Guide

## 1. Create the Expo project

```bash
npx create-expo-app KneadToKnow --template blank-typescript
cd KneadToKnow
```

## 2. Install dependencies

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context

# Firebase
npm install firebase

# UI & Utilities
npx expo install expo-image-picker expo-notifications expo-secure-store expo-splash-screen expo-font expo-linking

# Slider for proofing calculator
npx expo install @react-native-community/slider

# Async storage for local state (checklist progress, etc.)
npx expo install @react-native-async-storage/async-storage
```

## 3. Set up Firebase

1. Go to https://console.firebase.google.com
2. Create a new project called "KneadToKnow"
3. Add an Android app (package name: `com.yourname.kneadtoknow`)
4. Enable **Cloud Firestore** (start in test mode for now)
5. Enable **Firebase Storage**
6. Copy your Firebase config into `src/config/firebase.ts`

## 4. Set up Ecobee (Phase 5 — do this later)

1. Go to https://www.ecobee.com/developers/
2. Register a new app (name: "Knead to Know")
3. Copy your API key into `src/config/secrets.ts`

## 5. Copy source files

Copy the entire `src/` folder from this starter into your `KneadToKnow/` project.

## 6. Replace App.tsx

Replace the generated `App.tsx` with the one from this starter.

## 7. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go on your wife's phone to test immediately.

## 8. Build APK (when ready)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

This generates an APK you can download and sideload.
