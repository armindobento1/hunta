import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.onfoothunta.app",
  appName: "Hunta",
  webDir: "dist",
  ios: {
    contentInset: "never",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    // skipNativeAuth: all Firebase access goes through the JS SDK; the plugin
    // only produces the OAuth credential. This also avoids the known native
    // nonce mismatch with Sign in with Apple on iOS.
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ["google.com", "apple.com"],
    },
  },
};

export default config;
