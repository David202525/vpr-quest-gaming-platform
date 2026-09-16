const ITEMS = [
  'Луткоины за верные ответы',
  'Энергия на боссов',
  'Пет-робокот решает пример',
  'Тепловая карта ошибок',
  'Код комнаты для класса',
  'Капсулы по 15 минут',
  'Отчёт родителям в PDF',
  'Безопасный чат класса',
];

const Marquee = () => {
  return (
    <div className="overflow-hidden border-y border-border bg-ink py-3 text-ink-foreground">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex gap-10">
            {ITEMS.map((t) => (
              <span
                key={t}
                className="flex items-center gap-10 text-[0.7rem] font-medium uppercase tracking-[0.22em]"
              >
                {t}
                <i className="inline-block h-1 w-1 rotate-45 bg-primary" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
