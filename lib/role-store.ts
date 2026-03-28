export type Role = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

const STORAGE_KEY = "candentry_roles";

function makeId() {
  return `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function getRoles(): Role[] {
  const storage = getStorage();
  if (!storage) return [];

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Role[];
  } catch {
    return [];
  }
}

export function saveRole(title: string, description: string) {
  const storage = getStorage();
  if (!storage) return;

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (!trimmedTitle) return;

  const roles = getRoles();

  const exists = roles.some(
    (role) => role.title.toLowerCase() === trimmedTitle.toLowerCase()
  );

  if (exists) return;

  const newRole: Role = {
    id: makeId(),
    title: trimmedTitle,
    description: trimmedDescription,
    createdAt: new Date().toISOString(),
  };

  const updated = [newRole, ...roles];
  storage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getRoleById(id: string) {
  const roles = getRoles();
  return roles.find((role) => role.id === id) || null;
}

export function clearRoles() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}

/**
 * Public trial mode:
 * Do not auto-seed roles on app load.
 * Keep roles session-only and user-created during the current session.
 */
export function seedDemoRoles() {
  return;
}