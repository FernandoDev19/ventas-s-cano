export function formatDate(str: string) {
  return new Date(str).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}