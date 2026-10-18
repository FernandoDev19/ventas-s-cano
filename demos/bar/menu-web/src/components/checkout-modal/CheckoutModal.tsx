import { useEffect, useState, type FormEvent } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useCartStore } from "../../store/cart.store";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { OrderService } from "../../services/order.service";
import type { OrderCheckoutType } from "../../types/order.type";
import { formatCOP } from "../../utils/format";
import Button from "../ui/Button";

type Props = { tableId: string };
type Errors = Partial<Record<"nombre" | "celular" | "direccion", string>>;

const inputClasses =
  "w-full bg-transparent border-2 border-white/25 focus:border-gold text-white placeholder:text-white/30 p-3 rounded-none outline-none transition-colors";

export default function CheckoutModal({ tableId }: Props) {
  const { items, closeCheckout, openCart, openConfirmation, setLastOrder, resetCart } =
    useCartStore();
  const isTable = tableId !== "caja";

  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<OrderCheckoutType["tipoEntrega"]>(
    isTable ? "mesa" : "local",
  );
  const [direccion, setDireccion] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useBodyScrollLock(true);

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const backToCart = () => {
    closeCheckout();
    openCart();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCheckout();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCheckout]);

  const validate = (): Errors => {
    const next: Errors = {};
    if (nombre.trim().length < 2) next.nombre = "Escribe tu nombre.";
    if (celular.replace(/\D/g, "").length !== 10)
      next.celular = "El celular debe tener 10 dígitos.";
    if (tipoEntrega === "domicilio" && direccion.trim().length < 5)
      next.direccion = "Escribe la dirección de entrega.";
    return next;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    setSubmitError(null);
    try {
      const order = await OrderService.createOrder(
        {
          nombre: nombre.trim(),
          celular: celular.replace(/\D/g, ""),
          tipoEntrega,
          direccion: tipoEntrega === "domicilio" ? direccion.trim() : undefined,
          comentarios: comentarios.trim() || undefined,
          items: items.map((i) => ({
            id: String(i.id),
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            is_recipe: i.type === "recipe",
          })),
        },
        tableId,
      );
      setLastOrder(order);
      resetCart();
      closeCheckout();
      openConfirmation();
    } catch {
      setSubmitError("No pudimos enviar tu pedido. Revisa tu conexión e inténtalo de nuevo.");
      setSending(false);
    }
  };

  const options: { value: OrderCheckoutType["tipoEntrega"]; label: string }[] = isTable
    ? [{ value: "mesa", label: `En mesa #${tableId}` }]
    : [
        { value: "local", label: "Recoger en el bar" },
        { value: "domicilio", label: "Domicilio" },
      ];

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Finalizar pedido"
    >
      <div className="absolute inset-0 bg-black/80 animate-fade-in" onClick={closeCheckout} />

      <form
        onSubmit={submit}
        noValidate
        className="relative w-full md:max-w-lg max-h-[92vh] overflow-y-auto bg-ink text-white border border-gold/40 animate-rise"
      >
        <div className="flex items-start justify-between p-5 border-b border-gold/30">
          <div>
            <p className="text-gold text-xs font-bold uppercase tracking-widest">Último paso</p>
            <h2 className="text-3xl font-extrabold uppercase">Tus datos</h2>
          </div>
          <button
            type="button"
            onClick={closeCheckout}
            aria-label="Cerrar"
            className="p-1 text-white/70 hover:text-gold transition-colors cursor-pointer"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-xs font-bold uppercase tracking-widest mb-2">
              Nombre
            </label>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              placeholder="¿A nombre de quién?"
              className={inputClasses}
            />
            {errors.nombre && <p className="mt-1 text-sm text-red-400">{errors.nombre}</p>}
          </div>

          <div>
            <label htmlFor="celular" className="block text-xs font-bold uppercase tracking-widest mb-2">
              Celular
            </label>
            <input
              id="celular"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="300 000 0000"
              className={inputClasses}
            />
            {errors.celular && <p className="mt-1 text-sm text-red-400">{errors.celular}</p>}
          </div>

          <fieldset>
            <legend className="block text-xs font-bold uppercase tracking-widest mb-2">
              ¿Cómo lo quieres?
            </legend>
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTipoEntrega(opt.value)}
                  aria-pressed={tipoEntrega === opt.value}
                  className={`px-4 py-2.5 border text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    tipoEntrega === opt.value
                      ? "bg-gold border-gold text-charcoal"
                      : "border-white/25 text-white/80 hover:border-gold"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {tipoEntrega === "mesa" && (
              <p className="mt-2 text-sm text-white/60">Llevaremos tu pedido a la mesa #{tableId}.</p>
            )}
          </fieldset>

          {tipoEntrega === "domicilio" && (
            <div>
              <label htmlFor="direccion" className="block text-xs font-bold uppercase tracking-widest mb-2">
                Dirección
              </label>
              <input
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                autoComplete="street-address"
                placeholder="Calle, número, barrio"
                className={inputClasses}
              />
              {errors.direccion && <p className="mt-1 text-sm text-red-400">{errors.direccion}</p>}
            </div>
          )}

          <div>
            <label htmlFor="comentarios" className="block text-xs font-bold uppercase tracking-widest mb-2">
              Comentarios <span className="text-white/40 normal-case tracking-normal">(opcional)</span>
            </label>
            <textarea
              id="comentarios"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={2}
              placeholder="Sin hielo, alergias, etc."
              className={`${inputClasses} resize-none`}
            />
          </div>

          <ul className="border-t border-white/10 pt-4 space-y-1.5 text-sm">
            {items.map((i) => (
              <li key={`${i.type}-${i.id}`} className="flex justify-between gap-4 text-white/80">
                <span className="truncate">
                  {i.quantity} × {i.name}
                </span>
                <span className="whitespace-nowrap">{formatCOP(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 border-t border-gold/30 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm uppercase tracking-widest text-white/70">Total</span>
            <span className="font-playfair text-2xl font-bold text-gold">{formatCOP(total)}</span>
          </div>
          {submitError && <p className="text-sm text-red-400">{submitError}</p>}
          <Button type="submit" color="gold" disabled={sending || items.length === 0} className="w-full">
            {sending ? "Enviando..." : "Confirmar pedido"}
          </Button>
          <button
            type="button"
            onClick={backToCart}
            className="w-full text-xs uppercase tracking-widest text-white/50 hover:text-gold transition-colors cursor-pointer"
          >
            Volver al carrito
          </button>
        </div>
      </form>
    </div>
  );
}
