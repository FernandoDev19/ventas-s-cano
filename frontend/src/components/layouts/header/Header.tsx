import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Menu, X, ShoppingCart, DollarSign, Package, CreditCard } from 'lucide-react';
import LogoutButton from "../../LogoutButton";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Registrar', path: '/', icon: ShoppingCart },
    { name: 'Ventas del Día', path: '/sales', icon: DollarSign },
    { name: 'Deudas', path: '/debts', icon: CreditCard },
    { name: 'Productos', path: '/products', icon: Package },
    { name: 'Clientes', path: '/customers', icon: Package },
    { name: 'Gastos', path: '/expenses', icon: CreditCard },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 w-full z-20 transition-all duration-300 ${
          isScrolled
            ? 'bg-primary/95 backdrop-blur-xl shadow-lg py-2'
            : 'bg-primary shadow-md py-4'
        } text-primary-foreground`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleNavigation('/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="text-3xl">🍗</div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">SCANO</h1>
                  <p className="text-xs md:text-sm opacity-90 hidden sm:block">Sistema de Ventas</p>
                </div>
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-30 transition-all duration-300 ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`absolute top-0 right-0 h-full w-80 max-w-full bg-white shadow-xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
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
                      isActive
                        ? 'bg-primary text-white'
                        : 'hover:bg-primary/10'
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
