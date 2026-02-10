import { Duffel } from "@duffel/api";
import { getDuffelToken, getAppMode } from "@/lib/config/app-mode";

let client: Duffel | null = null;
let clientMode: string | null = null;

/**
 * Lazy-init singleton — avoids build failures when env var is missing.
 * Re-creates client if app mode changes (e.g. switching to live).
 */
export function getDuffelClient(): Duffel {
  const mode = getAppMode();
  if (!client || clientMode !== mode) {
    const token = getDuffelToken();
    client = new Duffel({ token });
    clientMode = mode;
  }
  return client;
}
