import { useState } from "react";
import { useCartStore } from "../../store/cart.store";
import type { OrderCheckoutType } from "../../types/order.type";
import { CheckoutService } from "../../services/checkout.service";

export default function CheckoutModal() {
  // Traemos los estados del store (debes agregar isOpenCheckout y closeCheckout a tu Zustand)
  const { isCheckoutOpen, closeCheckout, items, openConfirmation } = useCartStore();

  // Estados del formulario
  const [deliveryType, setDeliveryType] = useState<"domicilio" | "local">("domicilio");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comentarios, setComentarios] = useState("");

  if (!isCheckoutOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderItems = items.map((item) => ({
      id: String(item.id),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      is_recipe: item.type === "recipe" ? true : false,
    }));
    
    const orderData: OrderCheckoutType = {
      tipoEntrega: deliveryType,
      nombre,
      celular,
      direccion: deliveryType === "domicilio" ? direccion : "N/A",
      comentarios,
      items: orderItems
    };

    try {
      await CheckoutService.createOrder(orderData);
      
      closeCheckout();
      openConfirmation();
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      alert("Error al crear el pedido. Por favor, intenta de nuevo.");
    }

  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Contenedor del Modal: En móvil sube completo, en PC se centra */}
      <div className="bg-[#181818] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gold/15 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6 border-b border-gold/15 pb-3">
          <h3 className="font-playfair font-black text-xl text-gold">
            Finalizar Pedido
          </h3>
          <button 
            onClick={closeCheckout}
            className="text-muted hover:text-gold text-xl p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          
          {/* TIPO DE ENTREGA */}
          <div>
            <label className="block font-semibold text-white mb-2">
              Tipo de entrega *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                deliveryType === "domicilio"
                  ? "border-gold bg-gold/5 text-gold font-semibold"
                  : "border-gold/30 text-muted hover:bg-cream/30"
              }`}>
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === "domicilio"}
                  onChange={() => setDeliveryType("domicilio")}
                  className="accent-gold hidden"
                />
                🛵 Domicilio
              </label>

              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                deliveryType === "local"
                  ? "border-gold bg-gold/5 text-gold font-semibold"
                  : "border-gold/30 text-muted hover:bg-cream/30"
              }`}>
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === "local"}
                  onChange={() => setDeliveryType("local")}
                  className="accent-gold hidden"
                />
                🏪 Recoger en local
              </label>
            </div>
          </div>

          {/* NOMBRE */}
          <div className="flex flex-col gap-1">
            <label htmlFor="nombre" className="font-semibold text-white">
              Nombre *
            </label>
            <input
              id="nombre"
              type="text"
              required
              placeholder="Ej: Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 rounded-xl placeholder:text-muted border border-gold/30 focus:border-gold focus:outline-none bg-[#181818] text-white"
            />
          </div>

          {/* CELULAR */}
          <div className="flex flex-col gap-1">
            <label htmlFor="celular" className="font-semibold text-white">
              Celular *
            </label>
            <input
              id="celular"
              type="tel"
              required
              placeholder="Ej: 3001234567"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              className="w-full p-3 rounded-xl placeholder:text-muted border border-gold/30 focus:border-gold focus:outline-none bg-[#181818] text-white"
            />
          </div>

          {/* DIRECCIÓN (Condicional si es Domicilio) */}
          {deliveryType === "domicilio" && (
            <div className="flex flex-col gap-1 animate-in slide-in-from-top-2 duration-200">
              <label htmlFor="direccion" className="font-semibold text-white">
                Dirección *
              </label>
              <input
                id="direccion"
                type="text"
                required={deliveryType === "domicilio"}
                placeholder="Ej: Cra 43 # 70-10, Apto 3B"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full p-3 rounded-xl placeholder:text-muted border border-gold/30 focus:border-gold focus:outline-none bg-[#181818] text-white"
              />
            </div>
          )}

          {/* COMENTARIOS */}
          <div className="flex flex-col gap-1">
            <label htmlFor="comentarios" className="font-semibold text-white">
              Comentarios adicionales
            </label>
            <textarea
              id="comentarios"
              rows={3}
              placeholder="Ej: Sin cebolla, salsas aparte, tocar el timbre al llegar..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              className="w-full p-3 rounded-xl placeholder:text-muted border border-gold/30 focus:border-gold focus:outline-none bg-[#181818] text-white resize-none"
            />
          </div>

          {/* BOTÓN DE ACCIÓN */}
          <button
            type="submit"
            className="w-full bg-crimson hover:bg-crimson-dark text-white font-bold p-4 rounded-xl shadow-lg mt-2 transition-colors active:scale-98 cursor-pointer uppercase tracking-wider text-xs"
          >
            Confirmar y Enviar Pedido
          </button>
        </form>
      </div>
    </div>
  );
}