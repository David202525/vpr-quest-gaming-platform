import { useState } from 'react';
import Icon from '@/components/ui/icon';

const TOPICS = [
  'Дроби',
  'Проценты',
  'Площадь',
  'Запятая перед «что»',
  'Н и НН',
  '-ТСЯ / -ТЬСЯ',
  'Пищевые цепи',
  'Красная книга',
  'Даты XIV в.',
  'Пётр I',
];

const PUPILS = ['Настя Ф.', 'Тимур Г.', 'Оля Б.', 'Рома Д.', 'Женя Ш.', 'Лиза А.'];

// доля ошибок 0..100
const DATA: number[][] = [
  [82, 61, 40, 74, 55, 12, 20, 8, 35, 18],
  [90, 70, 52, 66, 41, 22, 15, 10, 44, 30],
  [58, 33, 25, 88, 79, 46, 9, 14, 26, 12],
  [76, 84, 61, 52, 33, 18, 41, 22, 58, 40],
  [44, 28, 16, 91, 68, 55, 12, 6, 30, 24],
  [88, 72, 58, 47, 60, 29, 33, 18, 51, 36],
];

const cellClass = (v: number) => {
  if (v >= 75) return 'bg-destructive text-destructive-foreground';
  if (v >= 55) return 'bg-primary text-primary-foreground';
  if (v >= 35) return 'bg-primary/45 text-foreground';
  if (v >= 20) return 'bg-primary/20 text-foreground';
  return 'bg-secondary text-muted-foreground';
};

const ErrorHeatmap = () => {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const worst = TOPICS.map((t, c) => ({
    topic: t,
    avg: Math.round(DATA.reduce((s, row) => s + row[c], 0) / DATA.length),
  }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);

  return (
    <section id="heatmap" className="border-b border-border bg-card py-20 md:py-28">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rubric text-primary">Аналитика успеваемости</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-light uppercase leading-[1.05] tracking-[0.04em]">
              Тепловая карта
              <br />
              ошибок
            </h2>
          </div>
          <p className="max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
            Видно не «класс слабый», а конкретную клетку: 7 «Б» сыпется на дробях и на запятой
            перед «что». Наведите курсор на клетку.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="overflow-x-auto rounded-md border border-border bg-background p-5">
            <table className="w-full min-w-[720px] border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="w-28" />
                  {TOPICS.map((t) => (
                    <th
                      key={t}
                      className="h-24 align-bottom text-[0.62rem] font-medium uppercase tracking-[0.1em] text-muted-foreground"
                    >
                      <span className="block origin-bottom-left -rotate-45 whitespace-nowrap pb-6 pl-2 text-left">
                        {t}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DATA.map((row, r) => (
                  <tr key={PUPILS[r]}>
                    <td className="pr-3 text-right text-[0.7rem] text-muted-foreground">
                      {PUPILS[r]}
                    </td>
                    {row.map((v, c) => (
                      <td key={c}>
                        <div
                          onMouseEnter={() => setHover({ r, c })}
                          onMouseLeave={() => setHover(null)}
                          className={`flex h-9 cursor-default items-center justify-center rounded-sm text-[0.65rem] font-medium transition-transform duration-200 hover:scale-110 ${cellClass(
                            v,
                          )}`}
                        >
                          {v}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
              <span className="rubric text-muted-foreground">Доля ошибок</span>
              <span className="flex items-center gap-1.5 text-[0.7rem]">
                <i className="h-3 w-6 rounded-sm bg-secondary" /> до 20%
              </span>
              <span className="flex items-center gap-1.5 text-[0.7rem]">
                <i className="h-3 w-6 rounded-sm bg-primary/45" /> 35–55%
              </span>
              <span className="flex items-center gap-1.5 text-[0.7rem]">
                <i className="h-3 w-6 rounded-sm bg-primary" /> 55–75%
              </span>
              <span className="flex items-center gap-1.5 text-[0.7rem]">
                <i className="h-3 w-6 rounded-sm bg-destructive" /> больше 75%
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="min-h-[132px] rounded-md border border-border bg-background p-5">
              <p className="rubric text-muted-foreground">Выбранная клетка</p>
              {hover ? (
                <div className="mt-3 animate-fade-in">
                  <p className="font-display text-xl uppercase tracking-[0.04em]">
                    {TOPICS[hover.c]}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{PUPILS[hover.r]}</p>
                  <p className="mt-3 text-3xl font-medium text-primary">
                    {DATA[hover.r][hover.c]}%
                  </p>
                  <p className="text-[0.7rem] text-muted-foreground">ошибочных ответов за месяц</p>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Наведите курсор на любую клетку, чтобы увидеть тему, ученика и долю ошибок.
                </p>
              )}
            </div>

            <div className="rounded-md border border-border bg-background p-5">
              <p className="rubric text-muted-foreground">Провалы класса</p>
              <ul className="mt-4 space-y-3">
                {worst.map((w) => (
                  <li key={w.topic}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{w.topic}</span>
                      <span className="font-medium text-primary">{w.avg}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full origin-left animate-grow-bar rounded-full bg-primary"
                        style={{ width: `${w.avg}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 flex items-start gap-2 text-[0.72rem] leading-relaxed text-muted-foreground">
                <Icon
                  name="Lightbulb"
                  size={14}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-primary"
                />
                Система сама предложит назначить тренировку по этим темам домашним заданием.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ErrorHeatmap;
