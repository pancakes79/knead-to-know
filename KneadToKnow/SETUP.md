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
npx expo install expo-image-picker expo-notifications expo-secure-store expo-splash-screen expo-font expo-linking expo-document-picker

# Slider for proofing calculator
npx expo install @react-native-community/slider

# Async storage for local state (checklist progress, etc.)
npx expo install @react-native-async-storage/async-storage
```

## 3. Download fonts

Download these from Google Fonts and place them in `assets/fonts/`:
- **DM Sans**: Regular, Medium, SemiBold, Bold
- **DM Mono**: Regular
- **Playfair Display**: Bold, ExtraBold

Expected filenames:
```
assets/fonts/
  DMSans-Regular.ttf
  DMSans-Medium.ttf
  DMSans-SemiBold.ttf
  DMSans-Bold.ttf
  DMMono-Regular.ttf
  PlayfairDisplay-Bold.ttf
  PlayfairDisplay-ExtraBold.ttf
```

## 4. Copy source files

Copy the entire `src/` folder, `App.tsx`, `app.json`, `eas.json`, `.env`,
`.env.example`, and `.gitignore` from this starter into your `KneadToKnow/` project.

## 5. Set up Firebase

1. Go to https://console.firebase.google.com
2. Your project **kneadtoknow-c4913** should already be there
3. Make sure **Cloud Firestore** is enabled (Build → Firestore Database)
4. Make sure **Firebase Storage** is enabled (Build → Storage)
5. Your Firebase config is already in `.env` — no changes needed

## 6. Set up the Anthropic API key (for recipe parsing)

1. Go to https://console.anthropic.com → API Keys
2. Create a new key
3. Paste it into `.env` as `EXPO_PUBLIC_CLAUDE_API_KEY`

## 7. Set up Home Assistant (for auto temperature)

This is done in the app itself — no code changes needed:
1. Open the app → Settings tab
2. Enter your Home Assistant URL (e.g., `http://192.168.1.XX:8123`)
3. Create a Long-Lived Access Token in HA:
   - HA → Profile (bottom-left) → scroll to "Long-Lived Access Tokens" → Create Token
4. Paste the token in the app → Test Connection
5. Select your ecobee temperature sensor from the auto-discovered list
6. Save — the Proofing tab can now pull your ambient temperature automatically

## 8. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone to test immediately.
The app works with sample recipes and local storage right away — Firebase
and Home Assistant connections are optional and can be set up anytime.

## 9. Build APK (when ready for wife's phone)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

This generates an APK you can download and sideload.
For future updates, use `expo-updates` for over-the-air patches.

## Project Structure

```
KneadToKnow/
├── App.tsx                    # Entry + navigation setup
├── app.json                   # Expo config (com.loafsloaves.kneadtoknow)
├── eas.json                   # EAS Build config
├── .env                       # Your API keys (git-ignored)
├── .env.example               # Template for .env (safe to commit)
├── src/
│   ├── config/
│   │   ├── firebase.ts        # Firebase init (reads from .env)
│   │   └── secrets.ts         # Claude API key (reads from .env)
│   ├── constants/
│   │   ├── proofingData.ts    # Temperature → time chart + interpolation
│   │   └── theme.ts           # Colors, fonts, spacing
│   ├── hooks/
│   │   ├── useRecipes.tsx     # Firestore CRUD with local fallback
│   │   └── useTimer.ts        # Countdown + background notifications
│   ├── navigation/
│   │   └── RootNavigator.tsx  # Bottom tabs + stack nav
│   ├── screens/
│   │   ├── RecipeListScreen.tsx
│   │   ├── RecipeDetailScreen.tsx
│   │   ├── ImportRecipeScreen.tsx
│   │   ├── ActiveBakeScreen.tsx
│   │   ├── ProofingScreen.tsx
│   │   ├── BakeLogScreen.tsx
│   │   └── SettingsScreen.tsx  # Home Assistant connection
│   ├── components/
│   │   ├── CountdownTimer.tsx
│   │   ├── StretchFoldTracker.tsx
│   │   └── StarRating.tsx
│   ├── services/
│   │   ├── recipeParser.ts    # Claude API for URL/file import
│   │   ├── homeAssistantApi.ts # HA REST API for temperature
│   │   └── notifications.ts   # Local notification setup
│   └── types/
│       └── index.ts
└── assets/
    ├── fonts/                  # Downloaded Google Fonts
    ├── icon.png
    └── splash.png
```
