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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getRoleById(id: string) {
  const roles = getRoles();
  return roles.find((role) => role.id === id) || null;
}

export function seedDemoRoles() {
  if (typeof window === "undefined") return;

  const existing = getRoles();
  if (existing.length > 0) return;

  const demoRoles: Role[] = [
    {
      id: "role-frontend",
      title: "Senior Frontend Developer",
      description:
        "Own frontend architecture, ship scalable React/Next.js experiences, and collaborate closely with design and product.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "role-product",
      title: "Product Manager",
      description:
        "Drive roadmap, align stakeholders, and own product execution from discovery to delivery.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "role-growth",
      title: "Growth Marketer",
      description:
        "Manage acquisition channels, optimize funnels, and scale growth experiments.",
      createdAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoRoles));
}