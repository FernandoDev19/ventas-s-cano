type Props = {
  text: string;
  onClick: () => void;
};

export default function CartButton({ text, onClick }: Props) {
  return (
    <button
      type="button"
      className="bg-crimson-dark text-cream font-medium tracking-wide uppercase text-xs p-3.5 rounded-xl w-full border border-crimson-dark hover:bg-cream hover:text-crimson-dark transition-all duration-200 ease shadow-sm cursor-pointer"
      onClick={onClick}
    >
      {text}
    </button>
  );
}