import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import CabinetHeader from '@/components/CabinetHeader';
import ChildShop from '@/components/cabinet/ChildShop';
import ChildBackground from '@/components/cabinet/ChildBackground';
import { useAuth } from '@/contexts/AuthContext';
import { api, Assignment, Child, ShopItem } from '@/lib/api';
import { Question } from '@/data/curriculum';
import { toast } from '@/hooks/use-toast';

const MODULE_HERO: Record<string, string> = {
  'Башня дробей': '🛡️',
  'Гастро-пунктуация': '🧑‍🍳',
  'Био-кликер': '🌱',
  'Хроно-битва': '🗡️',
};

type Tab = 'quests' | 'shop';

const ChildGame = () => {
  const { role, loading, refresh } = useAuth();
  const navigate = useNavigate();

  const [child, setChild] = useState<Child | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('quests');

  const [playing, setPlaying] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [payMode, setPayMode] = useState<string>('');
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [finished, setFinished] = useState<{ coins: number; xp: number } | null>(null);
  const [starting, setStarting] = useState(0);

  useEffect(() => {
    if (!loading && role !== 'child') navigate('/login');
  }, [loading, role, navigate]);

  const load = async () => {
    try {
      const data = await api.childDashboard();
      setChild(data.child);
      setAssignments(data.assignments);
      setShop(data.shop);
      setOwned((data.purchases || []).map((p: { code: string }) => p.code));
    } catch {
      /* no-op */
    }
    setDataLoading(false);
  };

  useEffect(() => {
    if (role === 'child') load();
  }, [role]);

  const start = async (a: Assignment) => {
    setStarting(a.id);
    try {
      const quiz = await api.quiz(a.topic, a.minutes || 15);
      if (!quiz.questions?.length) {
        toast({
          title: 'Заданий пока нет',
          description: 'По этой теме в банке нет активных заданий.',
          variant: 'destructive',
        });
        setStarting(0);
        return;
      }
      const res = await api.startTest();
      setQuestions(quiz.questions);
      setPayMode(res.paid_with);
      setPlaying(a);
      setStep(0);
      setCorrect(0);
      setPicked(null);
      setFinished(null);
      await load();
      if (res.paid_with === 'free') {
        toast({ title: 'Первый тест бесплатный', description: 'Дальше попытки тратят энергию.' });
      } else if (res.paid_with === 'energy') {
        toast({ title: 'Попытка потрачена', description: `Осталось: ${res.energy_left}` });
      }
    } catch (err) {
      toast({
        title: 'Попытки закончились',
        description:
          err instanceof Error
            ? err.message
            : 'Попроси родителей пополнить энергию или пригласить друга',
        variant: 'destructive',
      });
    }
    setStarting(0);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const isRight = i === questions[step].right;
    if (isRight) setCorrect((c) => c + 1);
    setTimeout(async () => {
      if (step + 1 < questions.length) {
        setStep((s) => s + 1);
        setPicked(null);
      } else {
        const total = questions.length;
        const finalCorrect = isRight ? correct + 1 : correct;
        try {
          const res = await api.submitResult({
            topic: playing!.topic,
            module: playing!.module,
            correct: finalCorrect,
            total,
            assignment_id: playing!.id,
          });
          setFinished({ coins: res.earned_coins, xp: res.earned_xp });
          await load();
          await refresh();
          toast({
            title: 'Капсула пройдена',
            description: `+${res.earned_coins} луткоинов и +${res.earned_xp} XP`,
          });
        } catch {
          setFinished({ coins: 0, xp: 0 });
        }
      }
    }, 650);
  };

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Загружаем игру…
      </div>
    );
  }

  const open = assignments.filter((a) => a.status !== 'done');
  const done = assignments.filter((a) => a.status === 'done');
  const unlimited = child?.plan === 'unlimited';
  const attemptsLeft = unlimited ? '∞' : (child?.parent_energy ?? 0);
  const freeLeft = !child?.free_used;

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-6 md:px-[30px] md:py-[22px]">
      <ChildBackground />
      <CabinetHeader title={`Игрок · ${child?.name || ''}`} />

      <main className="mx-auto mt-8 max-w-5xl pb-16">
        <div className="flex flex-wrap items-center gap-6 rounded-md border border-border bg-card p-6">
          <span className="animate-float text-5xl">{child?.avatar}</span>
          <div className="flex-1">
            <p className="rubric text-muted-foreground">Твой профиль</p>
            <p className="mt-1 font-display text-2xl uppercase tracking-[0.05em]">
              {child?.name}, {child?.grade} класс
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="inline-flex items-center gap-2 font-display text-2xl text-primary">
                <Icon name="Coins" size={18} strokeWidth={1.5} />
                {child?.coins}
              </p>
              <p className="rubric mt-1 text-muted-foreground">Луткоины</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-2 font-display text-2xl">
                <Icon name="Zap" size={18} strokeWidth={1.5} />
                {child?.xp}
              </p>
              <p className="rubric mt-1 text-muted-foreground">Опыт</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-2 font-display text-2xl">
                <Icon name="BatteryCharging" size={18} strokeWidth={1.5} />
                {freeLeft ? '1' : attemptsLeft}
              </p>
              <p className="rubric mt-1 text-muted-foreground">
                {freeLeft ? 'бесплатно' : 'попыток'}
              </p>
            </div>
          </div>
        </div>

        {playing ? (
          <div className="mt-6 rounded-md border border-border bg-card p-6 md:p-10">
            {finished ? (
              <div className="animate-fade-in text-center">
                <p className="text-6xl">{correct === questions.length ? '🏆' : '💪'}</p>
                <p className="mt-5 font-display text-2xl uppercase tracking-[0.05em]">
                  {correct} из {questions.length} верно
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  +{finished.coins} луткоинов · +{finished.xp} XP
                </p>
                <button
                  onClick={() => setPlaying(null)}
                  className="mt-7 rounded-md bg-primary px-7 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary-foreground"
                >
                  Вернуться к заданиям
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="rubric text-primary">{playing.module}</p>
                    <p className="mt-2 font-display text-xl uppercase tracking-[0.04em]">
                      {playing.topic}
                    </p>
                    {payMode === 'free' && (
                      <p className="mt-1 text-[0.7rem] text-muted-foreground">
                        Бесплатная попытка
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-display text-xl">
                        {step + 1}/{questions.length}
                      </p>
                      <p className="rubric text-muted-foreground">{playing.minutes} мин</p>
                    </div>
                    <span className="animate-float text-4xl">{MODULE_HERO[playing.module]}</span>
                  </div>
                </div>

                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                  />
                </div>

                <p className="mt-8 font-display text-[clamp(1.4rem,4vw,2rem)] uppercase tracking-[0.03em]">
                  {questions[step]?.q}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {questions[step]?.options.map((o, i) => {
                    const isRight = i === questions[step].right;
                    const state =
                      picked === null
                        ? 'border-border bg-background hover:-translate-y-0.5'
                        : isRight
                          ? 'border-primary bg-primary text-primary-foreground'
                          : picked === i
                            ? 'border-destructive bg-destructive text-destructive-foreground'
                            : 'border-border bg-background opacity-60';
                    return (
                      <button
                        key={o}
                        onClick={() => pick(i)}
                        className={`rounded-md border px-5 py-4 text-left text-sm transition-all ${state}`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPlaying(null)}
                  className="story-link mt-7 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Выйти из капсулы
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 flex gap-2">
              {([
                { id: 'quests', label: 'Задания' },
                { id: 'shop', label: 'Магазин' },
              ] as { id: Tab; label: string }[]).map((tItem) => (
                <button
                  key={tItem.id}
                  onClick={() => setTab(tItem.id)}
                  className={`flex-1 rounded-md border px-4 py-3 text-[0.68rem] font-medium uppercase tracking-[0.12em] transition-colors ${
                    tab === tItem.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:bg-secondary'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>

            {tab === 'quests' ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-md border border-border bg-card p-6">
                  <p className="rubric text-muted-foreground">Задания от родителей</p>
                  {open.length ? (
                    <ul className="mt-5 space-y-3">
                      {open.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-md border border-border bg-background p-5 transition-transform hover:-translate-y-0.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-display text-lg uppercase tracking-[0.04em]">
                                {a.topic}
                              </p>
                              <p className="mt-1 text-[0.72rem] text-muted-foreground">
                                {a.module} · до {a.deadline} · {a.minutes} мин
                              </p>
                            </div>
                            <button
                              onClick={() => start(a)}
                              disabled={starting === a.id}
                              className="rounded-md bg-primary px-5 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-50"
                            >
                              {starting === a.id ? '…' : 'Играть'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      Новых заданий нет. Отдыхай — или попроси родителей назначить тему.
                    </p>
                  )}

                  <div className="mt-6 flex items-start gap-3 rounded-md border border-primary/40 bg-primary/5 p-4">
                    <Icon
                      name="BatteryCharging"
                      size={17}
                      strokeWidth={1.4}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <p className="text-sm leading-relaxed">
                      {freeLeft
                        ? 'Первый тест бесплатный. Дальше каждая попытка тратит энергию — её пополняют родители или получают за приглашение друга.'
                        : `Осталось попыток: ${attemptsLeft}. Пополнить их может родитель в своём кабинете.`}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-border bg-card p-6">
                  <p className="rubric text-muted-foreground">Уже пройдено</p>
                  {done.length ? (
                    <ul className="mt-5 space-y-3">
                      {done.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center gap-3 border-b border-border pb-3 text-sm last:border-b-0"
                        >
                          <Icon
                            name="Check"
                            size={16}
                            strokeWidth={1.8}
                            className="shrink-0 text-primary"
                          />
                          {a.topic}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      Пока ничего не пройдено. Первая капсула — 15 минут, это быстро.
                    </p>
                  )}
                  <div className="mt-6 flex items-start gap-3 rounded-md border border-border bg-background p-4">
                    <Icon
                      name="Sparkles"
                      size={17}
                      strokeWidth={1.4}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <p className="text-sm leading-relaxed">
                      За каждый верный ответ — 20 луткоинов и 35 опыта. Трать их в магазине на скины
                      и питомцев.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <ChildShop
                  shop={shop}
                  owned={owned}
                  coins={child?.coins || 0}
                  onChange={async () => {
                    await load();
                    await refresh();
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ChildGame;