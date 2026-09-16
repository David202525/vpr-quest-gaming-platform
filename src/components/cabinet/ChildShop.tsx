import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, ShopItem } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const KIND_EMOJI: Record<string, string> = {
  skin: '🧥',
  pet: '🐾',
  emote: '💃',
};

type Props = {
  shop: ShopItem[];
  owned: string[];
  coins: number;
  onChange: () => void;
};

const ChildShop = ({ shop, owned, coins, onChange }: Props) => {
  const [busy, setBusy] = useState('');

  const buy = async (item: ShopItem) => {
    setBusy(item.code);
    try {
      const res = await api.buy(item.code);
      toast({ title: 'Куплено!', description: `${res.title} теперь твой.` });
      onChange();
    } catch (err) {
      toast({
        title: 'Не хватает',
        description: err instanceof Error ? err.message : 'Попробуй позже',
        variant: 'destructive',
      });
    }
    setBusy('');
  };

  return (
    <div className="rounded-md border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="rubric text-muted-foreground">Магазин луткоинов</p>
        <p className="inline-flex items-center gap-2 font-display text-xl text-primary">
          <Icon name="Coins" size={17} strokeWidth={1.5} />
          {coins}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shop.map((item) => {
          const has = owned.includes(item.code);
          const enough = coins >= item.price;
          return (
            <div
              key={item.code}
              className={`flex flex-col rounded-md border p-5 transition-transform hover:-translate-y-0.5 ${
                has ? 'border-primary bg-primary/5' : 'border-border bg-background'
              }`}
            >
              <span className="animate-float text-3xl">{KIND_EMOJI[item.kind] || '🎁'}</span>
              <p className="mt-4 font-display text-base uppercase tracking-[0.03em]">
                {item.title}
              </p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                {item.kind === 'pet' ? 'Питомец-помощник' : item.kind === 'emote' ? 'Эмоция' : 'Внешний вид'}
              </p>
              <button
                onClick={() => buy(item)}
                disabled={has || !enough || busy === item.code}
                className={`mt-5 rounded-md px-4 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.12em] transition-transform ${
                  has
                    ? 'bg-secondary text-muted-foreground'
                    : 'bg-primary text-primary-foreground hover:scale-[1.02] disabled:opacity-50'
                }`}
              >
                {has ? 'Уже есть' : busy === item.code ? '…' : `${item.price} ⧫`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChildShop;
