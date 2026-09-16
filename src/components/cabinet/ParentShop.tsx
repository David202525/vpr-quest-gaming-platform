import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, Invite, Parent, ShopItem } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const KIND_ICON: Record<string, string> = {
  energy: 'Zap',
  plan: 'Crown',
  service: 'FileText',
};

type Props = {
  parent: Parent | null;
  shop: ShopItem[];
  invites: Invite[];
  onChange: () => void;
};

const ParentShop = ({ parent, shop, invites, onChange }: Props) => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState('');
  const unlimited = parent?.plan === 'unlimited';

  const buy = async (code: string) => {
    setBusy(code);
    try {
      const res = await api.parentBuy(code);
      toast({ title: 'Оплачено', description: `${res.title} — начислено в кабинет.` });
      onChange();
    } catch (err) {
      toast({
        title: 'Не получилось',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
        variant: 'destructive',
      });
    }
    setBusy('');
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('invite');
    try {
      const res = await api.invite(email.trim());
      toast({
        title: 'Приглашение создано',
        description: `Код ${res.code}. Вам начислено ${res.reward} попытки.`,
      });
      setEmail('');
      onChange();
    } catch (err) {
      toast({
        title: 'Не получилось',
        description: err instanceof Error ? err.message : 'Проверьте почту',
        variant: 'destructive',
      });
    }
    setBusy('');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="rubric text-muted-foreground">Энергия — попытки на тесты</p>
            <p className="mt-2 inline-flex items-baseline gap-2 font-display text-4xl">
              <Icon name="Zap" size={24} strokeWidth={1.4} className="text-primary" />
              {unlimited ? '∞' : (parent?.energy ?? 0)}
            </p>
          </div>
          <p className="max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
            Первый тест ребёнка — бесплатно. Дальше каждая попытка списывает одну энергию. Пополнить
            можно покупкой или приглашением друга.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-6">
        <p className="rubric text-muted-foreground">Магазин родителя</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shop.map((item) => (
            <div
              key={item.code}
              className="flex flex-col rounded-md border border-border bg-background p-5 transition-transform hover:-translate-y-0.5"
            >
              <Icon
                name={KIND_ICON[item.kind] || 'Package'}
                size={20}
                strokeWidth={1.4}
                className="text-primary"
              />
              <p className="mt-4 font-display text-base uppercase tracking-[0.03em]">{item.title}</p>
              {item.energy ? (
                <p className="mt-1 text-[0.72rem] text-muted-foreground">
                  +{item.energy} попыток
                </p>
              ) : (
                <p className="mt-1 text-[0.72rem] text-muted-foreground">Разовая услуга</p>
              )}
              <button
                onClick={() => buy(item.code)}
                disabled={busy === item.code}
                className="mt-5 rounded-md bg-primary px-4 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {busy === item.code ? '…' : `${item.price} ₽`}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
          Оплата пока демонстрационная: покупка сразу зачисляется в кабинет.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-6">
        <p className="rubric text-muted-foreground">Пригласить друга — +3 попытки</p>
        <form onSubmit={invite} noValidate className="mt-5 flex flex-wrap gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Почта друга"
            className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy === 'invite'}
            className="rounded-md bg-primary px-6 py-3 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-60"
          >
            Пригласить
          </button>
        </form>

        {invites.length > 0 && (
          <ul className="mt-5 space-y-2">
            {invites.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-sm last:border-b-0"
              >
                <span className="text-muted-foreground">{i.email}</span>
                <span className="font-display tracking-[0.14em]">{i.code}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ParentShop;
