import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  HomeIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  PhoneIcon,
  XMarkIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { BAR, whatsappLink } from "../../../config/bar";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { InstagramIcon, FacebookIcon, WhatsAppIcon } from "../../../components/ui/icons";

type Props = {
  isDrawerOpen: boolean;
  onClose: () => void;
};

const navItems = [
  { label: "Inicio", icon: HomeIcon, href: "/" },
  { label: "Menú", icon: BookOpenIcon, href: "/menu" },
  { label: "Reservaciones", icon: ClipboardDocumentListIcon, href: "#reservaciones" },
  { label: "Eventos", icon: CalendarDaysIcon, href: "#eventos" },
  { label: "Contacto / Ubicación", icon: PhoneIcon, href: "#footer" },
  { label: "Sobre nosotros", icon: InformationCircleIcon, href: "/about-us" },
];

const socialItems = [
  { label: "Instagram", href: BAR.instagram, icon: InstagramIcon },
  { label: "Facebook", href: BAR.facebook, icon: FacebookIcon },
  { label: "WhatsApp", href: whatsappLink("Hola! Me gustaría realizar un pedido"), icon: WhatsAppIcon },
];

const itemClasses =
  "w-full flex items-center gap-4 px-4 py-3 text-left text-white font-medium hover:bg-white/10 focus-visible:bg-white/10 transition-colors cursor-pointer";

export function SidebarWithBurgerMenu({ isDrawerOpen, onClose }: Props) {
  const navigate = useNavigate();
  useBodyScrollLock(isDrawerOpen);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawerOpen, onClose]);

  const handleNavClick = (href: string) => {
    onClose();

    if (href.startsWith("/")) {
      navigate(href);
      return;
    }

    // Ancla (#seccion): si existe en la página actual se hace scroll; si no, se va al inicio con el hash.
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else navigate(`/${href}`);
    }, 300);
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[15000] ${isDrawerOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isDrawerOpen}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-ink border-l border-gold/30 flex flex-col p-4 transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-4 p-4">
          <img src="/logo-l-white.svg" alt={BAR.name} className="h-10 w-auto" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="text-white hover:text-gold transition-colors cursor-pointer"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-col">
          {navItems.map(({ label, icon: Icon, href }) => (
            <button key={label} type="button" className={itemClasses} onClick={() => handleNavClick(href)}>
              <Icon className="h-5 w-5 text-gold" />
              {label}
            </button>
          ))}
        </nav>

        <hr className="my-3 border-white/10" />

        <div className="flex flex-col">
          {socialItems.map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={itemClasses}>
              <span className="text-gold">
                <Icon />
              </span>
              {label}
            </a>
          ))}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
