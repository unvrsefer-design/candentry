export function startTrialIfNeeded() {
  if (typeof window === "undefined") return;

  const existing = localStorage.getItem("candentry_trial_started");

  if (!existing) {
    localStorage.setItem("candentry_trial_started", Date.now().toString());
  }
}

export function getTrialDaysLeft(): number {
  if (typeof window === "undefined") return 0;

  const started = localStorage.getItem("candentry_trial_started");
  if (!started) return 7;

  const startTime = parseInt(started, 10);
  const now = Date.now();

  const diffDays = (now - startTime) / (1000 * 60 * 60 * 24);
  return Math.max(0, 7 - Math.floor(diffDays));
}

export function isTrialExpired(): boolean {
  return getTrialDaysLeft() <= 0;
}