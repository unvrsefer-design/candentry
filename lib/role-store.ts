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

export function getRoles(): Role[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Role[];
  } catch {
    return [];
  }
}

export function saveRole(title: string, description: string) {
  if (typeof window === "undefined") return;

  const roles = getRoles();

  const newRole: Role = {
    id: makeId(),
    title,
    description,
    createdAt: new Date().toISOString(),
  };

  const updated = [newRole, ...roles];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getRoleById(id: string) {
  const roles = getRoles();
  return roles.find((r) => r.id === id) || null;
}