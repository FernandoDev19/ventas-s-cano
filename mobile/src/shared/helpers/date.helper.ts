const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD en hora LOCAL */
export const toLocalDateStr = (d: Date | string = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

/** Rango local "YYYY-MM-DD" → ISO UTC para comparar con created_at */
export const localRangeISO = (start: string, end: string) => ({
  startISO: new Date(`${start}T00:00:00`).toISOString(),
  endISO: new Date(`${end}T23:59:59.999`).toISOString(),
});

/** Parsea "YYYY-MM-DD" como fecha local (new Date("2026-11-22") la toma como UTC) */
export const parseLocalDate = (s: string) =>
  new Date(s.length === 10 ? `${s}T00:00:00` : s);

export const isToday = (d: Date | string) => toLocalDateStr(d) === toLocalDateStr();