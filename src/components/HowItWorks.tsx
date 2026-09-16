import Icon from '@/components/ui/icon';

const CHARACTERS = [
  {
    emoji: '🛡️',
    name: 'Ланцелот',
    role: 'Башня дробей',
    anim: 'animate-float',
    delay: '0s',
  },
  {
    emoji: '☕',
    name: 'Бариста Зпт',
    role: 'Гастро-пунктуация',
    anim: 'animate-sway',
    delay: '0.4s',
  },
  {
    emoji: '🌱',
    name: 'Протоклет',
    role: 'Био-кликер',
    anim: 'animate-float',
    delay: '0.8s',
  },
  {
    emoji: '⌛',
    name: 'Хронос',
    role: 'Хроно-битва',
    anim: 'animate-sway',
    delay: '1.2s',
  },
];

const STEPS = [
  {
    n: '01',
    icon: 'KeyRound',
    title: 'Родитель заводит кабинет',
    text: 'Добавляет ребёнка и получает для него код игрока и ПИН. Ребёнок заходит по ним — без почты, пароля и лишних данных.',
  },
  {
    n: '02',
    icon: 'Gamepad2',
    title: 'Ученик не видит учебник',
    text: 'Он видит башни, кофейню, планету и машину времени. Каждое верное действие — это решённое задание из демоверсии ВПР.',
  },
  {
    n: '03',
    icon: 'Coins',
    title: 'Прогресс превращается в лут',
    text: 'Луткоины и опыт за каждый верный ответ. Тратить можно на скины, петов и эмоции — но только внутри платформы.',
  },
  {
    n: '04',
    icon: 'ChartNoAxesColumn',
    title: 'Родитель видит правду',
    text: 'В закрытом кабинете — тепловая карта: видно, что ребёнок сыпется на дробях, а не «в целом плохо занимается».',
  },
];

const HowItWorks = () => {
  return (
    <section id="how" className="paper-grain border-b border-border py-20 md:py-28">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <p className="rubric text-primary">Что это вообще такое</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-light uppercase leading-[1.05] tracking-[0.04em]">
              Не тренажёр
              <br />
              с галочками,
              <br />а четыре игры
            </h2>
            <p className="mt-6 max-w-[46ch] text-[0.95rem] leading-relaxed text-muted-foreground">
              ВПР-Quest заменяет прорешивание типовых вариантов игровым процессом. Задания те же —
              из кодификатора ВПР для 3–8 классов. Обёртка другая: ребёнок держит оборону замка,
              варит кофе, оживляет планету и спорит с Иваном Грозным.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {CHARACTERS.map((c) => (
                <div
                  key={c.name}
                  className="group flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 transition-shadow hover:shadow-[6px_6px_0_0_hsl(var(--primary))]"
                >
                  <span
                    className={`text-2xl ${c.anim}`}
                    style={{ animationDelay: c.delay }}
                  >
                    {c.emoji}
                  </span>
                  <span className="leading-tight">
                    <span className="block font-display text-sm uppercase tracking-[0.08em]">
                      {c.name}
                    </span>
                    <span className="block text-[0.7rem] text-muted-foreground">{c.role}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ol className="relative space-y-0">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                className="group grid grid-cols-[auto_1fr] gap-5 border-t border-border py-7 last:border-b"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon name={s.icon} size={18} strokeWidth={1.4} />
                </div>
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="rubric text-muted-foreground">{s.n}</span>
                    <h3 className="font-display text-xl uppercase tracking-[0.04em]">{s.title}</h3>
                  </div>
                  <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;