export default {
  name: 'addawlatul-makkiyyah',
  slug: 'addawlatul-makkiyyah',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'addawlatulmakkiyyah',
  userInterfaceStyle: 'automatic',
  ios: { icon: './assets/expo.icon' },
  android: {
    package: 'com.makkiyyah',
    adaptiveIcon: {
      backgroundColor: '#F4EFE4',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { output: 'static', favicon: './assets/images/favicon.png' },
  plugins: [
    ['expo-router', { headers: { 'Cross-Origin-Embedder-Policy': 'credentialless', 'Cross-Origin-Opener-Policy': 'same-origin' } }],
    ['expo-splash-screen', { backgroundColor: '#FCFAF5', image: './assets/images/splash-icon.png', imageWidth: 76 }],
    'expo-sqlite',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: {
    eas: {
      projectId: 'c1f336e3-9b47-466a-9bd0-f57c6fd74a8b',
    },
  },
};
