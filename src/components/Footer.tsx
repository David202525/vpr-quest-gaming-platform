import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const COLUMNS = [
  {
    title: 'Платформа',
    links: [
      { label: 'Как устроено', href: '#how' },
      { label: 'Игровые модули', href: '#modules' },
      { label: 'Магазин луткоинов', href: '#shop' },
    ],
  },
  {
    title: 'Родителю',
    links: [
      { label: 'Как это работает', href: '#classes' },
      { label: 'Тепловая карта', href: '#heatmap' },
      { label: 'Отчёты и контроль', href: '#parents' },
    ],
  },
  {
    title: 'Вход',
    links: [
      { label: 'Кабинет родителя', href: '/login', route: true },
      { label: 'Вход для ребёнка', href: '/login', route: true },
      { label: 'Безопасность', href: '#parents' },
    ],
  },
];

const Footer = () => {
  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border bg-card py-14">
      <div className="container">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="font-display text-xl tracking-[0.02em]">
              <span className="border-b border-foreground pb-0.5">ВПР-Quest</span>
            </p>
            <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
              Образовательная игровая платформа подготовки к ВПР для 3–8 классов. Битва за лут
              вместо скучных вариантов.
            </p>
            <div className="mt-6 flex gap-3">
              {['Send', 'Share2', 'Mail'].map((n) => (
                <span
                  key={n}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon name={n} size={15} strokeWidth={1.4} />
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="rubric text-muted-foreground">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {'route' in l && l.route ? (
                      <Link
                        to={l.href}
                        className="story-link text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        onClick={go(l.href)}
                        className="story-link text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
          <span>© 2026 ВПР-Quest</span>
          <span>ФЗ-152 · данные на серверах в РФ · 6+</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;