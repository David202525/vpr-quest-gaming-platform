import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const NAV = [
  { label: 'Предметы', href: '#modules', caret: true },
  { label: 'Кабинет учителя', href: '#classes' },
  { label: 'Как устроено', href: '#how' },
  { label: 'Родителям', href: '#parents' },
  { label: 'Школам', href: '#cta' },
];

const scrollTo = (href: string) => {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Header = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollTo(href);
  };

  return (
    <div className="px-4 pt-4 md:px-[30px] md:pt-[22px]">
      <header className="flex h-[50px] items-stretch rounded-md border border-border bg-card">
        <div className="flex w-[108px] flex-none items-center justify-center border-r border-border font-display text-[0.95rem] tracking-[0.01em]">
          <span className="border-b border-foreground pb-[2px]">ВПР-Quest</span>
        </div>

        <nav className="hidden flex-1 items-center border-r border-border pl-6 lg:flex">
          {NAV.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              onClick={go(item.href)}
              className={`story-link whitespace-nowrap px-5 text-[0.72rem] font-medium uppercase tracking-[0.1em] transition-colors hover:text-primary ${
                i === 0 ? 'inline-flex items-center' : ''
              }`}
            >
              {item.label}
              {item.caret && (
                <i className="ml-2 inline-block h-[7px] w-[7px] -translate-x-[2px] -translate-y-[2px] rotate-45 border-b border-r border-current" />
              )}
            </a>
          ))}
        </nav>

        <div className="flex flex-1 items-center border-r border-border pl-5 lg:hidden">
          <span className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">
            Подготовка к ВПР
          </span>
        </div>

        <button
          onClick={() => scrollTo('#classes')}
          className="flex w-[54px] flex-none items-center justify-center border-r border-border transition-colors hover:bg-secondary"
          aria-label="Кабинет учителя"
        >
          <Icon name="User" size={16} strokeWidth={1.2} />
        </button>

        <button
          onClick={() => scrollTo('#shop')}
          className="relative flex w-[66px] flex-none items-center justify-center border-r border-border transition-colors hover:bg-secondary"
          aria-label="Магазин луткоинов"
        >
          <Icon name="ShoppingBag" size={16} strokeWidth={1.2} />
          <b className="absolute right-[10px] top-[6px] text-[0.62rem] font-medium">24</b>
        </button>

        <div className="hidden w-[52px] flex-none items-center justify-center text-[0.72rem] font-medium tracking-[0.1em] lg:flex">
          RU
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="flex w-[52px] flex-none items-center justify-center transition-colors hover:bg-secondary lg:hidden"
              aria-label="Меню"
            >
              <Icon name="Menu" size={18} strokeWidth={1.4} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[78vw] max-w-xs bg-card">
            <div className="mt-10 flex flex-col gap-1">
              {NAV.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={go(item.href)}
                  className="border-b border-border py-4 font-display text-lg uppercase tracking-[0.06em]"
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  scrollTo('#cta');
                }}
                className="mt-6 rounded-md bg-primary px-5 py-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary-foreground"
              >
                Создать класс
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </div>
  );
};

export default Header;
