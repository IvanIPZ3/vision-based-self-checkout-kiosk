import { formatCurrency } from '../utils/format';

interface ProductCardProps {
  id: string;
  name: string;
  quantity: number;
  price: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const ProductCard = ({ id, name, quantity, price, selected, onSelect }: ProductCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? 'border-kiosk-accent bg-kiosk-accent/18 shadow-[0_0_0_2px_rgba(45,226,199,0.2)]'
          : 'border-slate-700 bg-slate-900/70 hover:border-slate-500 hover:bg-slate-800'
      }`}
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <p className="text-xl font-bold text-slate-100">{name}</p>
        <p className="rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1 text-base font-bold text-slate-200">
          x{quantity}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{formatCurrency(price)} за одиницю</p>
        <p className="text-2xl font-display font-extrabold text-kiosk-accent">{formatCurrency(price * quantity)}</p>
      </div>
    </button>
  );
};
