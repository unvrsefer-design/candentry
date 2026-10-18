export const AUTH_COOKIE_NAME = "candentry_auth";

export type UserRole = "admin" | "recruiter";

export type AuthUser = {
  username: string;
  name: string;
  role: UserRole;
};

type DemoUser = AuthUser & {
  password: string;
};

function getDemoUsers(): DemoUser[] {
  const users: DemoUser[] = [];

  const adminUsername = process.env.CANDENTRY_ADMIN_USERNAME;
  const adminPassword = process.env.CANDENTRY_ADMIN_PASSWORD;

  const recruiterUsername = process.env.CANDENTRY_RECRUITER_USERNAME;
  const recruiterPassword = process.env.CANDENTRY_RECRUITER_PASSWORD;

  if (adminUsername && adminPassword) {
    users.push({
      username: adminUsername,
      password: adminPassword,
      name: "Administrator",
      role: "admin",
    });
  }

  if (recruiterUsername && recruiterPassword) {
    users.push({
      username: recruiterUsername,
      password: recruiterPassword,
      name: "Recruiter",
      role: "recruiter",
    });
  }

  return users;
}

export function authenticateUser(
  username: string,
  password: string
): AuthUser | null {
  if (!process.env.CANDENTRY_AUTH_SECRET) {
    return null;
  }

  const normalizedUsername = username.trim();

  const user = getDemoUsers().find(
    (item) =>
      item.username === normalizedUsername &&
      item.password === password
  );

  if (!user) {
    return null;
  }

  return {
    username: user.username,
    name: user.name,
    role: user.role,
  };
}

function getSecret(): string {
  const secret = process.env.CANDENTRY_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "CANDENTRY_AUTH_SECRET must contain at least 32 characters."
    );
  }

  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat(
    (4 - (normalized.length % 4)) % 4
  );

  const binary = atob(normalized + padding);

  return Uint8Array.from(
    binary,
    (char) => char.charCodeAt(0)
  );
}

async function getSigningKey() {
  const encoder = new TextEncoder();

  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  user: AuthUser
): Promise<string> {
  const payload = {
    username: user.username,
    name: user.name,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  };

  const encodedPayload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const key = await getSigningKey();

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  return `${encodedPayload}.${bytesToBase64Url(
    new Uint8Array(signature)
  )}`;
}

export async function verifySessionToken(
  token?: string
): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, encodedSignature] = parts;

    if (!encodedPayload || !encodedSignature) {
      return null;
    }

    const key = await getSigningKey();

    const signatureBytes = base64UrlToBytes(
      encodedSignature
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as BufferSource,
      new TextEncoder().encode(encodedPayload)
    );

    if (!valid) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(
        base64UrlToBytes(encodedPayload)
      )
    );

    if (
      !payload ||
      typeof payload.username !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== "admin" &&
        payload.role !== "recruiter") ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (Date.now() >= payload.exp) {
      return null;
    }

    const accountExists = getDemoUsers().some(
      (account) =>
        account.username === payload.username &&
        account.role === payload.role
    );

    if (!accountExists) {
      return null;
    }

    return {
      username: payload.username,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}