export function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDetailLabel(rawKey: string): string {
  return rawKey
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function formatDetailValue(value: string | number | boolean | null | undefined): string {
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }
  return String(value ?? "-");
}
