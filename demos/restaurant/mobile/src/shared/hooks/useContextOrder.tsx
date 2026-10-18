import { useContext } from "react";
import { OrderContext } from "../../core/context/OrderContext";

export const useContextOrder = () => {
  const context = useContext(OrderContext);

  if (!context)
    throw new Error("useContextOrder debe usarse dentro de un OrderProvider");

  return context;
};
