export const AUTH_COOKIE_NAME = "candentry_auth";

export function getDemoCredentials() {
  return {
    username: process.env.DEMO_USERNAME || "demo",
    password: process.env.DEMO_PASSWORD || "candentry123",
  };
}

export function buildAuthCookieValue(username: string) {
  return `candentry:${username}`;
}

export function isValidAuthCookie(value?: string) {
  return Boolean(value && value.startsWith("candentry:"));
}