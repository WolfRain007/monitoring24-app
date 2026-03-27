export function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function shortId(value: string | null) {
  if (!value) return "—";
  return value.slice(0, 8);
}

export function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(2);
}

export function formatText(value: string | null) {
  if (!value || !value.trim()) return "—";
  return value;
}
