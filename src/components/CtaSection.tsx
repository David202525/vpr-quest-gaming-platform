import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const CtaSection = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Напишите имя и отчество';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = 'Проверьте адрес почты';
    if (school.trim().length < 2) next.school = 'Укажите школу или город';
    setErrors(next);
    if (Object.keys(next).length) return;

    toast({
      title: 'Класс создан',
      description: `${name}, код комнаты отправим на ${email}. Останется продиктовать его ученикам.`,
    });
    setName('');
    setEmail('');
    setSchool('');
  };

  const field = (
    id: 'name' | 'email' | 'school',
    label: string,
    value: string,
    set: (v: string) => void,
    type = 'text',
  ) => (
    <label className="block text-sm">
      <span className="text-ink-foreground/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        className={`mt-2 w-full rounded-md border bg-ink-foreground/5 px-4 py-3 text-sm text-ink-foreground outline-none transition-colors placeholder:text-ink-foreground/35 focus:border-primary ${
          errors[id] ? 'border-destructive' : 'border-ink-foreground/25'
        }`}
      />
      {errors[id] && <span className="mt-1.5 block text-xs text-destructive">{errors[id]}</span>}
    </label>
  );

  return (
    <section id="cta" className="bg-ink py-20 text-ink-foreground md:py-28">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p className="rubric text-primary">Начать</p>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,6vw,4.5rem)] font-light uppercase leading-[1.03] tracking-[0.05em]">
              Соберите
              <br />
              первый класс
              <br />
              за пять минут
            </h2>
            <p className="mt-6 max-w-[44ch] text-sm leading-relaxed text-ink-foreground/75">
              Создаёте комнату, диктуете код на уроке, задаёте первую тему. Дальше платформа
              работает сама: ученики играют, вы получаете тепловую карту, родители — отчёт.
            </p>

            <div className="mt-10 flex flex-wrap gap-8">
              {[
                { n: '4', t: 'игровых модуля' },
                { n: '3–8', t: 'классы' },
                { n: '15 мин', t: 'капсульная сессия' },
              ].map((s) => (
                <div key={s.t}>
                  <p className="font-display text-4xl font-light">{s.n}</p>
                  <p className="rubric mt-1 text-ink-foreground/60">{s.t}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4 text-xs text-ink-foreground/60">
              <span className="inline-flex items-center gap-2">
                <Icon name="Smartphone" size={14} strokeWidth={1.4} />
                PWA: ставится на рабочий стол
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="Laptop" size={14} strokeWidth={1.4} />
                Работает в компьютерном классе
              </span>
            </div>
          </div>

          <form
            onSubmit={submit}
            noValidate
            className="rounded-md border border-ink-foreground/20 bg-ink-foreground/5 p-6 md:p-8"
          >
            <p className="rubric text-ink-foreground/60">Заявка учителя</p>
            <div className="mt-6 space-y-5">
              {field('name', 'Имя и отчество', name, setName)}
              {field('email', 'Рабочая почта', email, setEmail, 'email')}
              {field('school', 'Школа и город', school, setSchool)}
            </div>
            <button
              type="submit"
              className="mt-7 w-full rounded-md bg-primary px-6 py-4 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Создать класс
            </button>
            <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-foreground/50">
              Вход для учеников — через детские профили VK ID и Сбер ID. Данные хранятся на
              российских серверах.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
