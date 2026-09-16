import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Module = {
  id: string;
  subject: string;
  genre: string;
  title: string;
  setting: string;
  emoji: string;
  hero: string;
  mechanic: string;
  tasks: string[];
  fail: string;
};

const MODULES: Module[] = [
  {
    id: 'math',
    subject: 'Математика',
    genre: 'Tower Defense',
    title: 'Башня дробей',
    setting: 'Средневековый замок / форт из будущего',
    emoji: '🏰',
    hero: '🛡️',
    mechanic:
      'На тропу наступают монстры-примеры. Чтобы поставить башню лучников или магов, нужно решить пример. Особые башни: «Ускорение времени» — деление столбиком, «Заморозка» — отрицательные числа.',
    tasks: [
      'Порядок действий и скобки',
      'Боссы: проценты, движение, площадь и периметр',
      'Деление столбиком, отрицательные числа',
    ],
    fail: 'Ошибся — башня стреляет картошкой вместо фаерболов, а прорвавшийся враг уносит часть золота.',
  },
  {
    id: 'rus',
    subject: 'Русский язык',
    genre: 'Тайкун',
    title: 'Гастро-пунктуация',
    setting: 'Неоновая закусочная / магическая кофейня',
    emoji: '☕',
    hero: '🧑‍🍳',
    mechanic:
      'Игрок — владелец кафе. Гости присылают заказы сообщениями, и в тексте заказа спрятаны ошибки. Расставил запятые верно — официант донёс заказ до нужного столика.',
    tasks: [
      'Орфография: блюдо с ошибкой не готовится',
      'Пунктуация: запятая не там — гость уходит без чаевых',
      'Части речи: соус зависит от прилагательного или глагола',
    ],
    fail: 'На выручку покупаются новые рецепты: от простых предложений к прямой речи и деепричастным оборотам.',
  },
  {
    id: 'bio',
    subject: 'Биология',
    genre: 'Кликер',
    title: 'Био-кликер',
    setting: 'Пустая Земля, докембрий',
    emoji: '🌍',
    hero: '🌱',
    mechanic:
      'Планета пуста. Игрок кликает, чтобы создать органику, а накопив ресурс — отвечает на вопросы о пищевых цепочках, климате и строении клетки.',
    tasks: [
      'Классификация животных',
      'Красная книга РФ и правила поведения в лесу',
      'Основы первой помощи',
    ],
    fail: 'Верные ответы превращают пустыню в джунгли, ледниковый период и мегаполис. Ошибка — вымирание вида и откат планеты.',
  },
  {
    id: 'hist',
    subject: 'История',
    genre: 'Визуальная новелла',
    title: 'Хроно-битва',
    setting: 'Машина времени',
    emoji: '⌛',
    hero: '🗡️',
    mechanic:
      'Игрок попадает в ключевые точки истории России и говорит с Александром Невским, Иваном Грозным, Петром I. Стиль — современный комикс, без пыльных школьных портретов.',
    tasks: [
      'Даты и хронология',
      'Исторические личности и их решения',
      'Работа с картой и источником',
    ],
    fail: 'Куликовская битва: «Ждать» засадный полк — победа и бонусные луткоины. «Атаковать сейчас» — кат-сцена поражения и переигровка уровня.',
  },
];

const Modules = () => {
  const [active, setActive] = useState('math');

  return (
    <section id="modules" className="border-b border-border bg-card py-20 md:py-28">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rubric text-primary">Игровые модули</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-light uppercase leading-[1.05] tracking-[0.04em]">
              Четыре предмета —<br />
              четыре жанра
            </h2>
          </div>
          <p className="max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
            Каждый модуль собран вокруг реальных заданий ВПР. Переключайте вкладки — внутри
            механика, типы задач и то, что будет за ошибку.
          </p>
        </div>

        <Tabs value={active} onValueChange={setActive} className="mt-12">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {MODULES.map((m) => (
              <TabsTrigger
                key={m.id}
                value={m.id}
                className="rounded-md border border-border bg-background px-5 py-3 text-[0.72rem] font-medium uppercase tracking-[0.12em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
              >
                <span className="mr-2 text-base">{m.emoji}</span>
                {m.subject}
              </TabsTrigger>
            ))}
          </TabsList>

          {MODULES.map((m) => (
            <TabsContent key={m.id} value={m.id} className="mt-8">
              <div className="grid animate-fade-in gap-8 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-md border border-border bg-background p-7 md:p-10">
                  <p className="rubric text-muted-foreground">{m.genre}</p>
                  <h3 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.75rem)] font-light uppercase tracking-[0.05em]">
                    {m.title}
                  </h3>
                  <p className="mt-2 text-sm italic text-muted-foreground">{m.setting}</p>
                  <p className="mt-6 max-w-[58ch] leading-relaxed">{m.mechanic}</p>

                  <div className="mt-8 flex items-start gap-3 rounded-md border border-primary/40 bg-primary/5 p-4">
                    <Icon
                      name="TriangleAlert"
                      size={18}
                      strokeWidth={1.4}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <p className="text-sm leading-relaxed">{m.fail}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-md border border-border bg-ink">
                    <span className="animate-float text-7xl" style={{ animationDelay: '0.2s' }}>
                      {m.hero}
                    </span>
                    <span className="absolute left-1/2 top-1/2 h-2 w-2 animate-orbit rounded-full bg-primary" />
                    <span className="rubric absolute bottom-3 left-4 text-ink-foreground/70">
                      Персонаж модуля
                    </span>
                  </div>

                  <ul className="rounded-md border border-border bg-background">
                    {m.tasks.map((t) => (
                      <li
                        key={t}
                        className="flex items-start gap-3 border-b border-border px-5 py-4 text-sm last:border-b-0"
                      >
                        <Icon
                          name="Check"
                          size={16}
                          strokeWidth={1.8}
                          className="mt-0.5 shrink-0 text-primary"
                        />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default Modules;
