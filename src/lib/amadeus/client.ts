const BASE_URL = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
const TOKEN_URL = `${BASE_URL}/v1/security/oauth2/token`;

interface AmadeusToken {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
  obtainedAt: number; // Date.now()
}

let cachedToken: AmadeusToken | null = null;

function isTokenValid(token: AmadeusToken): boolean {
  // Refresh 60s before actual expiry
  const expiresAt = token.obtainedAt + (token.expires_in - 60) * 1000;
  return Date.now() < expiresAt;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && isTokenValid(cachedToken)) {
    return cachedToken.access_token;
  }

  const apiKey = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("AMADEUS_API_KEY and AMADEUS_API_SECRET must be set");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    obtainedAt: Date.now(),
  };

  return cachedToken.access_token;
}

export class AmadeusApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AmadeusApiError";
    this.status = status;
    this.code = code;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make an authenticated GET request to the Amadeus API.
 * Retries up to 2 times with exponential backoff on 429/5xx.
 */
export async function amadeusGet<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const token = await getAccessToken();
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    // Token expired mid-flight — invalidate and retry
    if (res.status === 401) {
      cachedToken = null;
      if (attempt < maxRetries) continue;
    }

    // Rate limit or server error — backoff and retry
    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail =
        body?.errors?.[0]?.detail ?? body?.error_description ?? res.statusText;
      throw new AmadeusApiError(detail, res.status, body?.errors?.[0]?.code);
    }

    return (await res.json()) as T;
  }

  throw new AmadeusApiError("Max retries exceeded", 503);
}

/**
 * Make an authenticated POST request to the Amadeus API.
 * Same retry logic as amadeusGet.
 */
export async function amadeusPost<T>(
  path: string,
  body: unknown
): Promise<T> {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const token = await getAccessToken();
    const url = `${BASE_URL}${path}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 401) {
      cachedToken = null;
      if (attempt < maxRetries) continue;
    }

    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (!res.ok) {
      const responseBody = await res.json().catch(() => ({}));
      const detail =
        responseBody?.errors?.[0]?.detail ??
        responseBody?.error_description ??
        res.statusText;
      throw new AmadeusApiError(
        detail,
        res.status,
        responseBody?.errors?.[0]?.code
      );
    }

    return (await res.json()) as T;
  }

  throw new AmadeusApiError("Max retries exceeded", 503);
}
