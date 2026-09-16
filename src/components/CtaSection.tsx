import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const CtaSection = () => {
  return (
    <section id="cta" className="bg-ink py-20 text-ink-foreground md:py-28">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p className="rubric text-primary">Начать</p>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,6vw,4.5rem)] font-light uppercase leading-[1.03] tracking-[0.05em]">
              Два входа —
              <br />
              и всё готово
            </h2>
            <p className="mt-6 max-w-[44ch] text-sm leading-relaxed text-ink-foreground/75">
              Родитель заводит кабинет по почте, добавляет ребёнка и получает для него код и ПИН.
              Ребёнок заходит по этим данным, играет и выполняет назначенные темы.
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
                Работает и на компьютере
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-ink-foreground/20 bg-ink-foreground/5 p-6 md:p-8">
              <Icon name="ShieldCheck" size={22} strokeWidth={1.3} className="text-primary" />
              <p className="mt-5 font-display text-xl uppercase tracking-[0.05em]">
                Кабинет родителя
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-foreground/70">
                Почта и пароль. Внутри — дети, назначение тем и закрытая статистика по каждой
                теме ВПР.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block rounded-md bg-primary px-6 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                Войти или создать кабинет
              </Link>
            </div>

            <div className="rounded-md border border-ink-foreground/20 bg-ink-foreground/5 p-6 md:p-8">
              <Icon name="Gamepad2" size={22} strokeWidth={1.3} className="text-primary" />
              <p className="mt-5 font-display text-xl uppercase tracking-[0.05em]">Вход ребёнка</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-foreground/70">
                Только код игрока и ПИН из четырёх цифр. Ни почты, ни пароля, ни чужих профилей —
                и никакой статистики на экране.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block rounded-md border border-ink-foreground/45 px-6 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink-foreground transition-colors hover:bg-ink-foreground/10"
              >
                Войти по коду
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
