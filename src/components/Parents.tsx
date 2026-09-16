import Icon from '@/components/ui/icon';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const CHARACTERS_IMG =
  'https://cdn.poehali.dev/projects/048b225b-47e7-41bf-afa5-e621c72de1da/files/f480ab98-64e1-4b4a-9b99-0ca113ec3e27.jpg';

const FAQ = [
  {
    q: 'Что приходит родителю?',
    a: 'Раз в неделю — PDF-отчёт: какие темы ВПР ребёнок прошёл успешно, где остались пробелы и сколько времени он провёл в модулях. Ничего искать в интерфейсе не нужно.',
  },
  {
    q: 'Может ли ребёнок переписываться с незнакомыми?',
    a: 'Нет. Свободного ввода текста в общих чатах нет вообще — только предзаписанные фразы и эмодзи. Чат класса учитель может отключить одной кнопкой.',
  },
  {
    q: 'Есть ли реклама и настоящие платежи?',
    a: 'Рекламы сторонних товаров нет. Луткоины зарабатываются только игрой, реальными деньгами их не купить.',
  },
  {
    q: 'Где хранятся данные ребёнка?',
    a: 'На российских облачных серверах, в соответствии с ФЗ-152. Вход — через детские профили VK ID и Сбер ID, без сбора лишних сведений.',
  },
  {
    q: 'Не подсадит ли это на бесконечную игру?',
    a: 'Сессии капсульные, по 10–30 минут. Энергия для боссов восстанавливается сама — по одной единице в 10 минут, так что «сидеть всю ночь» механика не поощряет.',
  },
];

const Parents = () => {
  return (
    <section id="parents" className="paper-grain border-b border-border py-20 md:py-28">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <p className="rubric text-primary">Родителям и школе</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-light uppercase leading-[1.05] tracking-[0.04em]">
              Игра — да.
              <br />
              Дикий интернет — нет
            </h2>

            <div className="relative mt-8 overflow-hidden rounded-md border border-border bg-canvas">
              <img
                src={CHARACTERS_IMG}
                alt="Персонажи модулей ВПР-Quest"
                className="w-full object-cover"
              />
              <span className="rubric absolute bottom-3 left-4 rounded-sm bg-ink px-3 py-1.5 text-ink-foreground">
                Герои четырёх модулей
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: 'FileText', t: 'PDF-отчёт раз в неделю' },
                { icon: 'ShieldCheck', t: 'Данные на серверах в РФ' },
                { icon: 'BellOff', t: 'Ноль сторонней рекламы' },
                { icon: 'Smile', t: 'Модерация всех персонажей' },
              ].map((b) => (
                <div
                  key={b.t}
                  className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3.5 text-sm"
                >
                  <Icon name={b.icon} size={17} strokeWidth={1.4} className="text-primary" />
                  {b.t}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
              {FAQ.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left font-display text-lg uppercase tracking-[0.03em] hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 rounded-md border border-border bg-card p-6">
              <p className="rubric text-muted-foreground">Отчёт за неделю · пример</p>
              <p className="mt-3 font-display text-xl uppercase tracking-[0.04em]">
                Рома Д., 7 «Б»
              </p>
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  { t: 'Порядок действий', v: 92 },
                  { t: 'Проценты', v: 64 },
                  { t: '-Н- и -НН-', v: 38 },
                ].map((r) => (
                  <li key={r.t}>
                    <div className="flex items-baseline justify-between">
                      <span>{r.t}</span>
                      <span className="text-muted-foreground">{r.v}% верных</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full origin-left animate-grow-bar rounded-full bg-primary"
                        style={{ width: `${r.v}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[0.72rem] leading-relaxed text-muted-foreground">
                Время в модулях: 2 ч 40 мин. Рекомендация: повторить «-Н- и -НН-» двумя капсулами
                по 15 минут.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Parents;
