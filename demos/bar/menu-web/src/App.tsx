import ShortlyAboutUs from "./components/sections/shortly-about-us/ShortlyAboutUs";
import WhatWeOffer from "./components/sections/what-we-offer/WhatWeOffer";
import MenuPreview from "./components/sections/menu/MenuPreview";
import Events from "./components/sections/events/Events";
import MeetTheTeam from "./components/sections/team/MeetTheTeam";
import UpcomingEvents from "./components/sections/events/UpcomingEvents";
import Reservations from "./components/sections/reservations/Reservations";
import { WhatsAppIcon } from "./components/ui/icons";
import { whatsappLink } from "./config/bar";

export default function App() {
  return (
    <main className="min-h-screen">
      <ShortlyAboutUs />
      <WhatWeOffer />
      <MenuPreview />
      <Reservations />
      <Events />
      <MeetTheTeam />
      <UpcomingEvents />

      <a
        href={whatsappLink("Hola! Me gustaría realizar una reserva")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Realiza tu reserva por WhatsApp"
        className="z-[10000] fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-green-500 text-white p-4 rounded-full shadow-xl border border-green-500/30 active:scale-98 transition-transform"
      >
        <WhatsAppIcon className="h-6 w-6" />
      </a>
    </main>
  );
}
