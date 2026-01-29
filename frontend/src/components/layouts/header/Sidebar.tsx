import { X, ShoppingCart, DollarSign, Package, CreditCard } from "lucide-react";
import LogoutButton from "../../common/LogoutButton";

type Props = {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  handleNavigation: (path: string) => void;
};

export default function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleNavigation,
}: Props) {
  const navLinks = [
    { name: "Registrar", path: "/", icon: ShoppingCart },
    { name: "Ventas del Día", path: "/sales", icon: DollarSign },
    { name: "Deudas", path: "/debts", icon: CreditCard },
    { name: "Productos", path: "/products", icon: Package },
    { name: "Clientes", path: "/customers", icon: Package },
    { name: "Gastos", path: "/expenses", icon: CreditCard },
    { name: "Estadísticas", path: "/reports", icon: Package },
  ];

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-30 transition-all duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`absolute top-0 right-0 h-full w-80 max-w-full bg-white shadow-xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-foreground/20">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🍗</div>
                <div>
                  <h2 className="text-lg font-bold">Menú</h2>
                  <p className="text-xs opacity-90">Pollos Asados</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNavigation(link.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive ? "bg-primary text-white" : "hover:bg-primary/10"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{link.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-primary-foreground/20">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
