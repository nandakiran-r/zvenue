# ZVenue

## Project info

This is a native cross-platform mobile app built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev).

**Platform**: Native iOS & Android app, exportable to web
**Framework**: Expo Router + React Native

## Getting Started

The only requirement is having Node.js & Bun installed - [install Node.js with nvm](https://github.com/nvm-sh/nvm) and [install Bun](https://bun.sh/docs/installation)

Follow these steps:

```bash
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd ZVenue

# Step 3: Install the necessary dependencies
bun i

# Step 4: Start the development server
bun run start
```

## Technologies Used

- **React Native** - Cross-platform native mobile development framework
- **Expo** - Extension of React Native
- **Expo Router** - File-based routing system
- **TypeScript** - Type-safe JavaScript
- **React Query** - Server state management
- **Lucide React Native** - Icons

## Deployment

### iOS & Android

Use [EAS Build](https://docs.expo.dev/build/introduction/) to create production builds for the App Store and Google Play Store.

```bash
# Install EAS CLI
bun i -g @expo/eas-cli

# Configure project
eas build:configure

# Build
eas build --platform ios
eas build --platform android
```

### Web

```bash
eas build --platform web
```
