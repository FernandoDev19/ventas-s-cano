export const BAR = {
  name: "Sabor Espress",
  address: "Calle 1 # 23-47, Barranquilla / Atlantico",
  city: "Barranquilla / Atlantico",
  mapsUrl: "https://maps.app.goo.gl/T8UHD3yXNutVfY1F8",
  phone: "+57 300 000 0000",
  phoneRaw: "573000000000",
  email: "[EMAIL_ADDRESS]",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
};

export const SCHEDULE = [
  { label: "Lunes – Jueves", hours: "3:00 p. m. – 12:00 a. m." },
  { label: "Viernes – Domingo", hours: "3:00 p. m. – 2:00 a. m." },
];

export const HAPPY_HOUR = "Todos los días de 5:00 p. m. a 8:00 p. m.";

export const whatsappLink = (text: string) =>
  `https://api.whatsapp.com/send/?phone=${BAR.phoneRaw}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;

const isWeekendNight = (day: number) => day === 5 || day === 6 || day === 0;

/** Lun–Jue 15:00–24:00 · Vie–Dom 15:00–02:00 (del día siguiente). */
export function isOpenAt(date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < 2 && isWeekendNight((day + 6) % 7)) return true;
  const closing = isWeekendNight(day) ? 26 : 24;
  return hour >= 15 && hour < closing;
}
