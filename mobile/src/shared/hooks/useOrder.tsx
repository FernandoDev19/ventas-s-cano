import { useContext } from "react";
import { OrderContext } from "../../core/context/OrderContext";

export const useOrder = () => {
  const context = useContext(OrderContext);

  if (!context)
    throw new Error("useOrder debe usarse dentro de un OrderProvider");

  return context;
};
