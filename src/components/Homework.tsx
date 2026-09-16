import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const TOPIC_OPTIONS = [
  { id: 'nn', label: 'Правописание -Н- и -НН-', module: 'Гастро-пунктуация' },
  { id: 'frac', label: 'Действия с дробями', module: 'Башня дробей' },
  { id: 'comma', label: 'Запятая перед «что»', module: 'Гастро-пунктуация' },
  { id: 'percent', label: 'Задачи на проценты', module: 'Башня дробей' },
  { id: 'chain', label: 'Пищевые цепи', module: 'Био-кликер' },
  { id: 'kulikovo', label: 'Куликовская битва', module: 'Хроно-битва' },
];

const ASSIGNED = [
  {
    title: 'Правописание -Н- и -НН-',
    klass: '7 «Б»',
    deadline: 'до 21 сентября',
    done: 18,
    total: 26,
  },
  { title: 'Действия с дробями', klass: '5 «А»', deadline: 'до 19 сентября', done: 25, total: 28 },
  { title: 'Пищевые цепи', klass: '6 «Б»', deadline: 'до 24 сентября', done: 9, total: 31 },
];

const Homework = () => {
  const [topic, setTopic] = useState('nn');
  const [klass, setKlass] = useState('7 «Б»');
  const [deadline, setDeadline] = useState('2026-09-21');
  const [minutes, setMinutes] = useState(15);
  const [error, setError] = useState('');

  const selected = TOPIC_OPTIONS.find((t) => t.id === topic)!;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadline) {
      setError('Укажите дедлайн — без него система не соберёт отчёт.');
      return;
    }
    if (new Date(deadline) < new Date('2026-09-16')) {
      setError('Дедлайн уже прошёл. Выберите дату позже сегодняшней.');
      return;
    }
    setError('');
    toast({
      title: 'Домашнее задание назначено',
      description: `${selected.label} · ${klass} · капсула ${minutes} мин. Отчёт соберётся автоматически.`,
    });
  };

  return (
    <section id="homework" className="border-b border-border py-20 md:py-28">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rubric text-primary">Домашние задания</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-light uppercase leading-[1.05] tracking-[0.04em]">
              Одна тема,
              <br />
              один дедлайн
            </h2>
          </div>
          <p className="max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
            Назначьте конкретный модуль — например, только «-Н- и -НН-». Система соберёт отчёт
            сама, вручную проверять ничего не нужно.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={submit}
            className="rounded-md border border-border bg-card p-6 md:p-8"
            noValidate
          >
            <p className="rubric text-muted-foreground">Новое задание</p>

            <label className="mt-6 block text-sm">
              <span className="text-muted-foreground">Тема</span>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {TOPIC_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted-foreground">Класс</span>
                <select
                  value={klass}
                  onChange={(e) => setKlass(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  {['5 «А»', '6 «Б»', '7 «Б»'].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-muted-foreground">Дедлайн</span>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="mt-6">
              <span className="text-sm text-muted-foreground">
                Длина капсульной сессии: <b className="text-foreground">{minutes} мин</b>
              </span>
              <div className="mt-3 flex gap-2">
                {[10, 15, 20, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(m)}
                    className={`rounded-md border px-4 py-2 text-xs font-medium transition-colors ${
                      m === minutes
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-secondary'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-md border border-border bg-background px-4 py-3 text-sm">
              <span className="text-muted-foreground">Модуль: </span>
              {selected.module}
            </div>

            {error && (
              <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
                <Icon name="CircleAlert" size={15} strokeWidth={1.6} />
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-md bg-primary px-6 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Назначить классу
            </button>
          </form>

          <div className="rounded-md border border-border bg-card p-6 md:p-8">
            <p className="rubric text-muted-foreground">Уже назначено</p>
            <ul className="mt-6 space-y-5">
              {ASSIGNED.map((a) => {
                const pct = Math.round((a.done / a.total) * 100);
                return (
                  <li key={a.title} className="border-b border-border pb-5 last:border-b-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-display text-lg uppercase tracking-[0.04em]">
                        {a.title}
                      </span>
                      <span className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                        {a.klass} · {a.deadline}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full origin-left animate-grow-bar rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[0.72rem] text-muted-foreground">
                      Сдали {a.done} из {a.total} — {pct}%
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex items-start gap-3 rounded-md border border-primary/40 bg-primary/5 p-4">
              <Icon
                name="MessagesSquare"
                size={18}
                strokeWidth={1.4}
                className="mt-0.5 shrink-0 text-primary"
              />
              <p className="text-sm leading-relaxed">
                Общий чат класса отключаемый: свободного ввода нет, только заготовленные фразы и
                эмодзи, нейросеть фильтрует мат и личные данные.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Homework;
