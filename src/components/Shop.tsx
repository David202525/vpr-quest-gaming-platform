import { useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Item = {
  id: string;
  emoji: string;
  name: string;
  kind: 'Скин' | 'Пет' | 'Эмоция' | 'Фон';
  price: number;
  desc: string;
};

const ITEMS: Item[] = [
  {
    id: 'cat',
    emoji: '🤖',
    name: 'Робот-кот',
    kind: 'Пет',
    price: 1200,
    desc: 'Решает один пример за тебя раз в час. Не спасёт на боссе, но выручит на обычной волне монстров.',
  },
  {
    id: 'raven',
    emoji: '🐦‍⬛',
    name: 'Ворон-шпаргальщик',
    kind: 'Пет',
    price: 1450,
    desc: 'Приносит редкие карточки-шпаргалки с правилом, которое сейчас нужно.',
  },
  {
    id: 'panda',
    emoji: '🐼',
    name: 'Кибер-панк панда',
    kind: 'Скин',
    price: 980,
    desc: 'Скин аватара с неоновой подсветкой. Работает во всех четырёх модулях.',
  },
  {
    id: 'form',
    emoji: '🎓',
    name: 'Форма 1954 года',
    kind: 'Скин',
    price: 640,
    desc: 'Школьная форма разных эпох — от гимназии до формы будущего.',
  },
  {
    id: 'cloak',
    emoji: '🫥',
    name: 'Плащ-невидимка',
    kind: 'Скин',
    price: 1700,
    desc: 'Скрывает твой профиль от чужих глаз на одну неделю, если хочется поиграть тихо.',
  },
  {
    id: 'dance',
    emoji: '🕺',
    name: 'Танец победы',
    kind: 'Эмоция',
    price: 520,
    desc: 'Эмоция под ритмичный трек без авторских прав. Проигрывается после разбитого босса.',
  },
  {
    id: 'bg',
    emoji: '🌌',
    name: 'Фон «Докембрий»',
    kind: 'Фон',
    price: 430,
    desc: 'Фон профиля из Био-кликера: пустая планета до первой органики.',
  },
  {
    id: 'crown',
    emoji: '👑',
    name: 'Корона рейтинга',
    kind: 'Скин',
    price: 2100,
    desc: 'Доступна только тем, кто держал стрик три недели подряд.',
  },
];

const Shop = () => {
  const [open, setOpen] = useState<Item | null>(null);
  const [energy, setEnergy] = useState(3);

  return (
    <section id="shop" className="border-b border-border bg-card py-20 md:py-28">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rubric text-primary">Экономика</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-light uppercase leading-[1.05] tracking-[0.04em]">
              Луткоины
              <br />и энергия
            </h2>
          </div>
          <p className="max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
            Луткоины ребёнок зарабатывает в игре и тратит в своём магазине. Энергия — это попытки
            на тесты, ими управляет родитель: первый тест бесплатный.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-border bg-background p-6">
            <Icon name="Coins" size={22} strokeWidth={1.3} className="text-primary" />
            <p className="mt-4 font-display text-3xl">1 240</p>
            <p className="mt-1 text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground">
              Луткоинов у игрока в среднем
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-6">
            <Icon name="Flame" size={22} strokeWidth={1.3} className="text-primary" />
            <p className="mt-4 font-display text-3xl">12 дней</p>
            <p className="mt-1 text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground">
              Самый длинный стрик подряд
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-6">
            <Icon name="Timer" size={22} strokeWidth={1.3} className="text-primary" />
            <p className="mt-4 font-display text-3xl">15 мин</p>
            <p className="mt-1 text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground">
              Капсульная сессия
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-6">
            <Icon name="BatteryCharging" size={22} strokeWidth={1.3} className="text-primary" />
            <div className="mt-4 flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-6 w-3 rounded-sm transition-colors ${
                    i < energy ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground">
              Попытки — в кабинете родителя
            </p>
            <button
              onClick={() => setEnergy((e) => Math.min(5, e + 1))}
              className="mt-3 inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-primary story-link"
            >
              <Icon name="UserPlus" size={12} strokeWidth={2} />
              Пригласить друга +3
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setOpen(item)}
              className="group animate-fade-in rounded-md border border-border bg-background p-6 text-left transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_hsl(var(--primary))]"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span
                className="block text-4xl transition-transform duration-500 group-hover:scale-110"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                {item.emoji}
              </span>
              <p className="rubric mt-5 text-muted-foreground">{item.kind}</p>
              <p className="mt-1 font-display text-lg uppercase tracking-[0.04em]">{item.name}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <Icon name="Coins" size={14} strokeWidth={1.6} />
                {item.price}
              </p>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="bg-card sm:max-w-md">
          {open && (
            <>
              <DialogHeader>
                <span className="mb-2 block text-5xl animate-float">{open.emoji}</span>
                <DialogTitle className="font-display text-2xl uppercase tracking-[0.05em]">
                  {open.name}
                </DialogTitle>
                <DialogDescription className="pt-2 text-sm leading-relaxed">
                  {open.desc}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
                <span className="rubric text-muted-foreground">{open.kind}</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                  <Icon name="Coins" size={15} strokeWidth={1.6} />
                  {open.price}
                </span>
              </div>
              <p className="text-[0.72rem] leading-relaxed text-muted-foreground">
                Покупка проходит только за внутриигровую валюту. Реальных платежей и рекламы
                сторонних товаров в детском профиле нет.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Shop;
