import { Link } from 'react-router-dom';

const HERO_SHOT =
  'https://cdn.poehali.dev/projects/048b225b-47e7-41bf-afa5-e621c72de1da/files/c3789ff5-57d6-4881-a633-c1ef2390e8a9.jpg';
const GRID =
  "url('https://cdn.poehali.dev/projects/048b225b-47e7-41bf-afa5-e621c72de1da/files/77f21566-ddbf-4432-916b-73104dd01098.jpg')";

const THUMBS = [
  { label: 'Математика', pos: '0% 0%' },
  { label: 'Русский', pos: '100% 0%' },
  { label: 'Биология', pos: '0% 100%' },
  { label: 'История', pos: '100% 100%' },
];

const scrollTo = (href: string) => {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Hero = () => {
  return (
    <section className="px-4 pb-6 pt-2 md:px-[30px] md:pb-[26px]">
      <div className="relative isolate min-h-[560px] overflow-hidden rounded-md bg-canvas md:h-[calc(100vh-106px)] md:min-h-[520px]">
        <img
          src={HERO_SHOT}
          alt="Крепость из модуля «Башня дробей»"
          className="h-full w-full object-cover object-[50%_42%]"
        />
        <div className="scrim-bottom pointer-events-none absolute inset-0" />

        <p className="rubric absolute right-4 top-4 z-[2] rounded-[3px] bg-ink px-3.5 pb-3 pt-2.5 text-right tracking-[0.16em] text-ink-foreground md:right-[42px] md:top-[30px]">
          Подготовка к ВПР
          <br />
          3–8 классы
          <span className="mt-2.5 ml-auto block h-px w-[46px] bg-ink-foreground/60" />
        </p>

        <div className="absolute bottom-6 left-5 z-[2] animate-rise text-ink-foreground [animation-delay:0.15s] md:bottom-[34px] md:left-[42px]">
          <p className="rubric opacity-85">Кабинет родителя</p>
          <h1 className="mt-2.5 font-display text-[clamp(2.6rem,9vw,88px)] font-light uppercase leading-[1.02] tracking-[0.06em]">
            Ребёнок
            <br />
            проходит ВПР
            <br />
            как игру
          </h1>
          <p className="mt-3.5 max-w-[30ch] text-[0.95rem] leading-[1.5] text-ink-foreground/85">
            Вы задаёте тему и дедлайн. Ребёнок играет, а вы видите, где он споткнулся.
          </p>
          <div className="mt-[22px] flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-md bg-primary px-[22px] py-[13px] text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              Кабинет родителя
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-ink-foreground/55 px-[22px] py-[13px] text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink-foreground transition-colors hover:bg-ink-foreground/10"
            >
              Вход для ребёнка
            </Link>
          </div>
        </div>

        <div className="absolute bottom-[34px] right-[42px] z-[2] hidden gap-2 xl:flex">
          {THUMBS.map((t, i) => (
            <figure
              key={t.label}
              onClick={() => scrollTo('#modules')}
              style={{ backgroundImage: GRID, backgroundPosition: t.pos }}
              className={`relative h-[88px] w-[118px] cursor-pointer animate-fade-in overflow-hidden rounded-[3px] bg-[length:200%_200%] transition-transform duration-300 hover:-translate-y-1 ${
                i === 3
                  ? 'border-2 border-ink-foreground'
                  : 'border border-ink-foreground/45'
              }`}
            >
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-[7px] py-[5px] text-[0.6rem] font-medium uppercase tracking-[0.12em] text-ink-foreground">
                {t.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;