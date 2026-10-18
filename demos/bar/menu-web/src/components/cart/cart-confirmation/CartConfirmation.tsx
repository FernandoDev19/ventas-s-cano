import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { whatsappLink } from "../../../config/bar";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { useCartStore } from "../../../store/cart.store";
import { formatCOP } from "../../../utils/format";
import Button from "../../ui/Button";

type Props = { onNewOrder?: () => void };

export default function CartConfirmation({ onNewOrder }: Props) {
  const { lastOrder, closeConfirmation, setLastOrder } = useCartStore();
  useBodyScrollLock(true);

  if (!lastOrder) return null;

  const { data } = lastOrder;
  const where =
    data.tipoEntrega === "mesa"
      ? `Mesa #${lastOrder.tableId}`
      : data.tipoEntrega === "domicilio"
        ? `Domicilio: ${data.direccion}`
        : "Recoger en el bar";

  const message = [
    `Hola! Quiero confirmar mi pedido ${lastOrder.id}`,
    `A nombre de: ${data.nombre}`,
    where,
    ...data.items.map((i) => `${i.quantity} x ${i.name}`),
    `Total: ${formatCOP(lastOrder.total)}`,
    data.comentarios ? `Comentarios: ${data.comentarios}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const finish = () => {
    closeConfirmation();
    setLastOrder(null);
    onNewOrder?.();
  };

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pedido confirmado"
    >
      <div className="absolute inset-0 bg-black/80 animate-fade-in" />
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-ink text-white border border-gold/40 animate-rise">
        <div className="m-4 border-4 border-white/90 p-6 flex flex-col items-center text-center gap-4">
          <CheckCircleIcon className="h-16 w-16 text-gold" />
          <div>
            <p className="text-gold text-xs font-bold uppercase tracking-widest">
              Pedido recibido
            </p>
            <h2 className="text-3xl font-extrabold uppercase">{lastOrder.id}</h2>
          </div>
          <p className="text-sm text-white/70">
            Gracias, {data.nombre}. {where}.
          </p>

          <ul className="w-full border-y border-white/10 py-3 space-y-1.5 text-sm text-left">
            {data.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 text-white/80">
                <span className="truncate">
                  {i.quantity} × {i.name}
                </span>
                <span className="whitespace-nowrap">{formatCOP(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="w-full flex items-baseline justify-between">
            <span className="text-sm uppercase tracking-widest text-white/70">Total</span>
            <span className="font-playfair text-2xl font-bold text-gold">
              {formatCOP(lastOrder.total)}
            </span>
          </div>

          <div className="w-full flex flex-col gap-3">
            <Button color="gold" href={whatsappLink(message)} className="w-full">
              Confirmar por WhatsApp
            </Button>
            <Button color="light" onClick={finish} className="w-full">
              Hacer otro pedido
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
