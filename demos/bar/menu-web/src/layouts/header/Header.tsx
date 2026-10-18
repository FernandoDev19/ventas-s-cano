import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import Hero from "./hero/Hero";
import Button from "../../components/ui/Button";
import { BAR, SCHEDULE } from "../../config/bar";

type Props = {
  onOpenDrawer: () => void;
  isDrawerOpen: boolean;
  showHero?: boolean;
  isOpenNow: boolean;
  tableId: string;
};

const IMAGES_COUNT = 3;

export default function Header({
  onOpenDrawer,
  isDrawerOpen,
  showHero = true,
  isOpenNow,
  tableId,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showHero) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % IMAGES_COUNT);
    }, 5000);
    return () => clearInterval(interval);
  }, [showHero]);

  const info = (
    <a
      href={BAR.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white hover:text-gold transition-colors flex flex-col gap-1 text-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        {BAR.address}
        {tableId !== "caja" && (
          <span className="bg-gold text-charcoal font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[11px]">
            Mesa # {tableId}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
            isOpenNow ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"
          }`}
        >
          {isOpenNow ? "● Abierto" : "○ Cerrado"}
        </span>
        <span className="text-gold font-medium text-sm">{SCHEDULE[0].hours}</span>
      </div>
    </a>
  );

  return (
    <header className="relative">
      <div className={`w-full ${showHero ? "h-screen min-h-[560px]" : "h-fit p-4 md:p-10"}`}>
        <div
          className={`z-50 border-4 md:border-8 border-white p-4 md:p-10 ${
            showHero
              ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] h-[85%]"
              : "relative w-full"
          }`}
        >
          <div className="flex justify-between items-center gap-3">
            <div className="hidden md:block w-1/3">{info}</div>
            <div className="flex md:justify-center md:w-1/3">
              <img className="w-auto h-10 md:h-13" src="/logo-l-white.svg" alt={`Logo ${BAR.name}`} />
            </div>
            <div className="flex justify-end md:w-1/3">
              <button
                type="button"
                onClick={onOpenDrawer}
                aria-label={isDrawerOpen ? "Cerrar menú" : "Abrir menú"}
                className="p-2 text-white hover:text-gold transition-colors cursor-pointer"
              >
                {isDrawerOpen ? (
                  <XMarkIcon className="h-8 w-8" />
                ) : (
                  <Bars3Icon className="h-8 w-8" />
                )}
              </button>
            </div>
          </div>
          <div className="md:hidden mt-3">{info}</div>

          {showHero && (
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <Button onClick={() => navigate("/menu")}>Explorar Menú</Button>
            </div>
          )}
        </div>
      </div>

      {showHero ? (
        <Hero activeIndex={activeIndex} />
      ) : (
        <>
          <img
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "brightness(0.6)" }}
          />
          <div className="absolute inset-0 bg-grain opacity-[0.5] pointer-events-none mix-blend-overlay z-2" />
        </>
      )}
    </header>
  );
}
