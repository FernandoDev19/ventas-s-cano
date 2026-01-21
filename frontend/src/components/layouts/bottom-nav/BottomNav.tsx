import { DollarSign, Receipt, ShoppingCart, Users } from "lucide-react";
import { NavLink } from "react-router";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
      <div className="grid grid-cols-4 gap-1 p-2">
        <NavLink to="/">
          {({ isActive }) => {
            return (
              <button
                className={`transition-colors duration-300 ease-in flex flex-col justify-center items-center rounded-lg gap-1 h-20 text-center w-full ${isActive ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-primary/80 hover:text-white'}`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-md">Vender</span>
              </button>
            );
          }}
        </NavLink>

        <NavLink to="/sales">
          {({ isActive }) => (
            <button
              className={`transition-colors duration-300 ease-in flex flex-col justify-center items-center rounded-lg gap-1 h-20 text-center w-full ${isActive ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-primary/80 hover:text-white'}`}
            >
              <Receipt className="h-6 w-6" />
              <span className="text-md">Ventas</span>
            </button>
          )}
        </NavLink>

        <NavLink to="/debts">
          {({ isActive }) => (
            <button
              className={`transition-colors duration-300 ease-in flex flex-col justify-center items-center rounded-lg gap-1 h-20 text-center w-full ${isActive ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-primary/80 hover:text-white'}`}
            >
              <Users className="h-6 w-6" />
              <span className="text-md">Deudas</span>
            </button>
          )}
        </NavLink>

        <NavLink to="/expenses">
          {({ isActive }) => (
            <button
              className={`transition-colors duration-300 ease-in flex flex-col justify-center items-center rounded-lg gap-1 h-20 text-center w-full ${isActive ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-primary/80 hover:text-white'}`}
            >
              <DollarSign className="h-6 w-6" />
              <span className="text-md">Gastos</span>
            </button>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
