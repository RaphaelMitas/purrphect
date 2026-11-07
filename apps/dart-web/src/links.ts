export interface Store {
  name: string;
  kicker: string;
  href: string | null;
}

export const APP_STORE: Store = { name: "App Store", kicker: "Download on the", href: null };

export const PLAY_STORE: Store = { name: "Google Play", kicker: "Get it on", href: null };

export const REPO_URL = "https://github.com/RaphaelMitas/purrphect";
