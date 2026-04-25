import type { CartItem } from '../types';
import { formatCurrency } from '../utils/format';
import { AppButton } from './AppButton';
import { ProductCard } from './ProductCard';

interface CartPanelProps {
  items: CartItem[];
  selectedItemId: string | null;
  total: number;
  onSelectItem: (id: string) => void;
  onDeleteSelected: () => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onRequestStaff: () => void;
}

export const CartPanel = ({
  items,
  selectedItemId,
  total,
  onSelectItem,
  onDeleteSelected,
  onClearCart,
  onCheckout,
  onRequestStaff,
}: CartPanelProps) => {
  const hasItems = items.length > 0;
  const itemsCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <aside className="panel flex h-full min-h-[560px] flex-col p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Поточний чек</p>
          <h2 className="mt-1 text-4xl font-display font-bold text-white">Товари</h2>
        </div>
        <div className="rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Позицій</p>
          <p className="text-2xl font-display font-extrabold text-kiosk-accent">{itemsCount}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto_auto] items-center rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
        <p>Товар</p>
        <p>К-сть</p>
        <p>Сума</p>
      </div>

      <div className="mt-3 flex-1 space-y-3 overflow-auto pr-1">
        {!hasItems && (
          <div className="panel-alt p-6 text-center">
            <p className="text-2xl font-semibold text-slate-200">Чек порожній</p>
            <p className="mt-2 text-base text-slate-400">Покладіть товари на платформу та натисніть «Сканувати товари».</p>
          </div>
        )}
        {items.map((item) => (
          <ProductCard
            key={item.id}
            id={item.id}
            name={item.name}
            quantity={item.quantity}
            price={item.price}
            selected={selectedItemId === item.id}
            onSelect={onSelectItem}
          />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-kiosk-accent/50 bg-gradient-to-r from-kiosk-accent/15 to-kiosk-action/15 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Сума до оплати</p>
        <p className="mt-2 text-5xl font-display font-extrabold text-kiosk-accent">{formatCurrency(total)}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3.5">
        <AppButton variant="danger" size="md" disabled={!selectedItemId} onClick={onDeleteSelected} fullWidth>
          Видалити обраний товар
        </AppButton>
        <AppButton variant="ghost" size="md" disabled={!hasItems} onClick={onClearCart} fullWidth>
          Очистити чек
        </AppButton>
        <AppButton variant="success" size="lg" disabled={!hasItems} onClick={onCheckout} fullWidth>
          Оплатити
        </AppButton>
        <AppButton variant="ghost" size="md" onClick={onRequestStaff} fullWidth>
          Покликати працівника
        </AppButton>
      </div>
    </aside>
  );
};
