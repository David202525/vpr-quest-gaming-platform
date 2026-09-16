import Icon from '@/components/ui/icon';

const STEPS = [
  {
    icon: 'UserPlus',
    title: 'Создаёте кабинет',
    text: 'Регистрация по почте — одна минута. Кабинет и вся статистика принадлежат только вам.',
  },
  {
    icon: 'KeyRound',
    title: 'Добавляете ребёнка',
    text: 'Система выдаёт код игрока и ПИН из четырёх цифр. По ним ребёнок заходит со своего устройства — без почты и пароля.',
  },
  {
    icon: 'ListChecks',
    title: 'Назначаете тему',
    text: 'Выбираете тему ВПР, дедлайн и длину капсулы: 10–30 минут. Задание появляется у ребёнка в игре.',
  },
  {
    icon: 'ChartNoAxesColumn',
    title: 'Видите результат',
    text: 'После каждой капсулы в вашем кабинете обновляется доля верных ответов по темам. Ребёнок эту статистику не видит.',
  },
];

const ParentFlow = () => {
  return (
    <section id="classes" className="border-b border-border py-20 md:py-28">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rubric text-primary">Как это работает</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-light uppercase leading-[1.05] tracking-[0.04em]">
              Родитель ведёт,
              <br />
              ребёнок играет
            </h2>
          </div>
          <p className="max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
            Учитель и школа не нужны. Всё держится на двух входах: ваш кабинет с аналитикой и
            детский вход по коду — только игра и задания.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="animate-fade-in rounded-md border border-border bg-card p-6 transition-transform hover:-translate-y-1"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center justify-between">
                <Icon name={s.icon} size={22} strokeWidth={1.3} className="text-primary" />
                <span className="font-display text-3xl text-muted-foreground/40">0{i + 1}</span>
              </div>
              <p className="mt-6 font-display text-lg uppercase tracking-[0.04em]">{s.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-md border border-primary/40 bg-primary/5 p-5">
          <Icon
            name="EyeOff"
            size={18}
            strokeWidth={1.4}
            className="mt-0.5 shrink-0 text-primary"
          />
          <p className="text-sm leading-relaxed">
            Статистика закрыта: её видит только родитель, к которому привязан ребёнок. Ни другие
            родители, ни сам ребёнок, ни посторонние доступа не имеют.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ParentFlow;
