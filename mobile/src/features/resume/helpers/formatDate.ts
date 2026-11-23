import { parseLocalDate } from "@/src/shared/helpers/date.helper";

export function formatDate(str: string) {
  return parseLocalDate(str).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}