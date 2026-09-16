import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

type ClassRoom = {
  id: string;
  name: string;
  code: string;
  pupils: number;
  done: number;
  leaders: { name: string; coins: number; xp: number; pet: string }[];
};

const CLASSES: ClassRoom[] = [
  {
    id: '5a',
    name: '5 «А»',
    code: 'QST-5A41',
    pupils: 28,
    done: 74,
    leaders: [
      { name: 'Марина К.', coins: 1840, xp: 5210, pet: '🤖' },
      { name: 'Егор П.', coins: 1620, xp: 4980, pet: '🐦‍⬛' },
      { name: 'Даша Л.', coins: 1495, xp: 4710, pet: '🐼' },
      { name: 'Артём С.', coins: 1310, xp: 4320, pet: '🦊' },
      { name: 'Вика Н.', coins: 1180, xp: 4090, pet: '🐱' },
    ],
  },
  {
    id: '6b',
    name: '6 «Б»',
    code: 'QST-6B07',
    pupils: 31,
    done: 52,
    leaders: [
      { name: 'Кирилл Ж.', coins: 2110, xp: 6040, pet: '🐦‍⬛' },
      { name: 'Соня М.', coins: 1755, xp: 5320, pet: '🐼' },
      { name: 'Лёша Р.', coins: 1502, xp: 4880, pet: '🤖' },
      { name: 'Полина Т.', coins: 1288, xp: 4410, pet: '🦊' },
      { name: 'Миша В.', coins: 1104, xp: 3990, pet: '🐱' },
    ],
  },
  {
    id: '7b',
    name: '7 «Б»',
    code: 'QST-7B93',
    pupils: 26,
    done: 38,
    leaders: [
      { name: 'Настя Ф.', coins: 1602, xp: 5110, pet: '🐼' },
      { name: 'Тимур Г.', coins: 1470, xp: 4790, pet: '🤖' },
      { name: 'Оля Б.', coins: 1355, xp: 4520, pet: '🐦‍⬛' },
      { name: 'Рома Д.', coins: 1190, xp: 4180, pet: '🦊' },
      { name: 'Женя Ш.', coins: 998, xp: 3760, pet: '🐱' },
    ],
  },
];

const TeacherClasses = () => {
  const [activeId, setActiveId] = useState('7b');
  const active = CLASSES.find((c) => c.id === activeId)!;

  const copyCode = () => {
    navigator.clipboard?.writeText(active.code);
    toast({
      title: 'Код комнаты скопирован',
      description: `Продиктуйте ученикам ${active.code} — они попадут в закрытый рейтинг класса.`,
    });
  };

  return (
    <section id="classes" className="border-b border-border py-20 md:py-28">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rubric text-primary">Кабинет учителя</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-light uppercase leading-[1.05] tracking-[0.04em]">
              Классы и рейтинг
            </h2>
          </div>
          <p className="max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
            Учитель генерирует код комнаты, ученики вводят его — и попадают в закрытый рейтинг
            своей группы. Никаких открытых профилей и чужих школ.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            {CLASSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full rounded-md border p-5 text-left transition-all ${
                  c.id === activeId
                    ? 'border-primary bg-card shadow-[6px_6px_0_0_hsl(var(--primary))]'
                    : 'border-border bg-card hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-2xl uppercase tracking-[0.06em]">
                    {c.name}
                  </span>
                  <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {c.pupils} учеников
                  </span>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full origin-left animate-grow-bar rounded-full bg-primary"
                    style={{ width: `${c.done}%` }}
                  />
                </div>
                <p className="mt-2 text-[0.7rem] text-muted-foreground">
                  Программа ВПР пройдена на {c.done}%
                </p>
              </button>
            ))}
          </div>

          <div className="rounded-md border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-6">
              <div>
                <p className="rubric text-muted-foreground">Код комнаты</p>
                <p className="mt-1 font-display text-3xl tracking-[0.18em]">{active.code}</p>
              </div>
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                <Icon name="Copy" size={15} strokeWidth={1.6} />
                Скопировать
              </button>
            </div>

            <div className="p-6">
              <p className="rubric text-muted-foreground">Таблица лидеров — {active.name}</p>
              <ul className="mt-5 space-y-1">
                {active.leaders.map((p, i) => (
                  <li
                    key={p.name}
                    className="grid animate-fade-in grid-cols-[28px_1fr_auto] items-center gap-4 border-b border-border py-3 last:border-b-0"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium ${
                        i === 0
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className="animate-float text-xl"
                        style={{ animationDelay: `${i * 0.3}s` }}
                      >
                        {p.pet}
                      </span>
                      <span className="text-sm">{p.name}</span>
                    </span>
                    <span className="flex items-center gap-5 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Icon name="Zap" size={14} strokeWidth={1.6} />
                        {p.xp} XP
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                        <Icon name="Coins" size={14} strokeWidth={1.6} />
                        {p.coins}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeacherClasses;
