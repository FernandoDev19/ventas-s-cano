import { MinusIcon, PlusIcon } from "@heroicons/react/24/solid";

type Props = {
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  canAdd?: boolean;
  tone?: "light" | "dark";
};

export default function QtyControl({
  quantity,
  onAdd,
  onRemove,
  canAdd = true,
  tone = "light",
}: Props) {
  const base =
    "h-9 w-9 flex items-center justify-center border transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none";
  const tones =
    tone === "dark"
      ? "border-gold/60 text-gold hover:bg-gold hover:text-charcoal"
      : "border-charcoal text-charcoal hover:bg-charcoal hover:text-white";

  return (
    <div className="inline-flex items-center gap-3">
      <button type="button" onClick={onRemove} aria-label="Quitar uno" className={`${base} ${tones}`}>
        <MinusIcon className="h-4 w-4" />
      </button>
      <span
        className={`min-w-5 text-center font-bold tabular-nums ${tone === "dark" ? "text-white" : "text-charcoal"}`}
        aria-live="polite"
      >
        {quantity}
      </span>
      <button type="button" onClick={onAdd} disabled={!canAdd} aria-label="Agregar uno" className={`${base} ${tones}`}>
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
