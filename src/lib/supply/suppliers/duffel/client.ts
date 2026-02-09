import { Duffel } from "@duffel/api";

let client: Duffel | null = null;

/** Lazy-init singleton — avoids build failures when env var is missing */
export function getDuffelClient(): Duffel {
  if (!client) {
    const token = process.env.DUFFEL_API_TOKEN;
    if (!token) throw new Error("DUFFEL_API_TOKEN must be set");
    client = new Duffel({ token });
  }
  return client;
}
