import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import CabinetHeader from '@/components/CabinetHeader';
import ParentHeatmap from '@/components/cabinet/ParentHeatmap';
import ParentShop from '@/components/cabinet/ParentShop';
import ParentBackground from '@/components/cabinet/ParentBackground';
import { useAuth } from '@/contexts/AuthContext';
import { api, Assignment, Child, Invite, Parent, ShopItem } from '@/lib/api';
import { GRADES, SUBJECTS } from '@/data/curriculum';
import { DbTopic } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const AVATARS = ['🐼', '🤖', '🦊', '🐦‍⬛', '🐱', '🐲'];
type Tab = 'progress' | 'assign' | 'shop';

const ParentCabinet = () => {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  const [parent, setParent] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [allTopics, setAllTopics] = useState<DbTopic[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('progress');
  const [dataLoading, setDataLoading] = useState(true);

  const [childName, setChildName] = useState('');
  const [grade, setGrade] = useState('5');
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState('🐼');
  const [addError, setAddError] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const [subject, setSubject] = useState<string>('Математика');
  const [topicId, setTopicId] = useState('frac');
  const [deadline, setDeadline] = useState('');
  const [minutes, setMinutes] = useState(15);
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    if (!loading && role !== 'parent') navigate('/login');
  }, [loading, role, navigate]);

  const load = async () => {
    try {
      const data = await api.parentDashboard();
      setParent(data.parent);
      setChildren(data.children);
      setAssignments(data.assignments);
      setInvites(data.invites);
      setShop(data.shop);
      try {
        const tData = await api.topics();
        setAllTopics(tData.topics);
      } catch {
        /* no-op */
      }
      setActiveId((cur) => cur ?? (data.children.length ? data.children[0].id : null));
    } catch {
      /* no-op */
    }
    setDataLoading(false);
  };

  useEffect(() => {
    if (role === 'parent') load();
  }, [role]);

  const active = children.find((c) => c.id === activeId) || null;

  const gradeOf = (t: DbTopic) =>
    Array.isArray(t.grades) ? t.grades : String(t.grades).split(',');

  const availableTopics = allTopics.filter(
    (t) =>
      t.subject === subject &&
      t.count > 0 &&
      (!active || gradeOf(t).includes(String(active.grade))),
  );
  const selectedTopic = availableTopics.find((t) => t.slug === topicId) || availableTopics[0];

  useEffect(() => {
    if (availableTopics.length && !availableTopics.some((t) => t.slug === topicId)) {
      setTopicId(availableTopics[0].slug);
    }
  }, [subject, activeId, availableTopics.length]);

  const addChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    try {
      const data = await api.addChild({ name: childName.trim(), grade, pin, avatar });
      setChildName('');
      setPin('');
      setAddOpen(false);
      await load();
      setActiveId(data.child.id);
      toast({
        title: 'Ребёнок добавлен',
        description: `Код: ${data.child.code}, ПИН: ${data.child.pin}`,
      });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Не получилось добавить');
    }
  };

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');
    if (!active || !selectedTopic) {
      setAssignError('Сначала добавьте ребёнка');
      return;
    }
    try {
      await api.assign({
        child_id: active.id,
        topic: selectedTopic.label,
        module: selectedTopic.module,
        deadline,
        minutes,
      });
      await load();
      toast({
        title: 'Задание назначено',
        description: `${selectedTopic.label} · ${active.name} · ${minutes} мин`,
      });
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Не получилось назначить');
    }
  };

  const copyCode = (c: Child) => {
    navigator.clipboard?.writeText(c.code);
    toast({ title: 'Код скопирован', description: `${c.code} · ПИН ${c.pin}` });
  };

  const inputClass =
    'mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary';

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Загружаем кабинет…
      </div>
    );
  }

  const childAssignments = assignments.filter((a) => a.child_id === activeId);
  const TABS: { id: Tab; label: string }[] = [
    { id: 'progress', label: 'Прогресс' },
    { id: 'assign', label: 'Задания' },
    { id: 'shop', label: 'Энергия и услуги' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-6 md:px-[30px] md:py-[22px]">
      <ParentBackground />
      <CabinetHeader title={`Кабинет родителя · ${parent?.name || ''}`} />

      <main className="mx-auto mt-8 max-w-6xl pb-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rubric text-primary">Только для вас</p>
            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.25rem)] font-light uppercase leading-[1.05] tracking-[0.05em]">
              Дети и их прогресс
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {parent?.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-4 text-[0.68rem] font-medium uppercase tracking-[0.12em] transition-colors hover:bg-secondary"
              >
                <Icon name="Database" size={15} strokeWidth={1.5} />
                Банк заданий
              </button>
            )}
            <div className="rounded-md border border-border bg-card px-5 py-4">
            <p className="rubric text-muted-foreground">Попытки</p>
            <p className="mt-1 inline-flex items-center gap-2 font-display text-2xl">
              <Icon name="Zap" size={18} strokeWidth={1.4} className="text-primary" />
              {parent?.plan === 'unlimited' ? '∞' : (parent?.energy ?? 0)}
            </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-3">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full rounded-md border p-5 text-left transition-all ${
                  c.id === activeId
                    ? 'border-primary bg-card shadow-[6px_6px_0_0_hsl(var(--primary))]'
                    : 'border-border bg-card hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg uppercase tracking-[0.05em]">
                    <span className="mr-2">{c.avatar}</span>
                    {c.name}
                  </span>
                  <span className="text-[0.66rem] uppercase tracking-[0.1em] text-muted-foreground">
                    {c.grade} класс
                  </span>
                </div>
                <div className="mt-3 flex gap-5 text-[0.72rem] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="Coins" size={13} strokeWidth={1.6} />
                    {c.coins}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="Zap" size={13} strokeWidth={1.6} />
                    {c.xp} XP
                  </span>
                </div>
              </button>
            ))}

            {addOpen ? (
              <form
                onSubmit={addChild}
                noValidate
                className="rounded-md border border-border bg-card p-5"
              >
                <p className="rubric text-muted-foreground">Новый ребёнок</p>
                <label className="mt-4 block text-sm">
                  <span className="text-muted-foreground">Имя</span>
                  <input
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="text-muted-foreground">Класс</span>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className={inputClass}
                    >
                      {GRADES.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted-foreground">ПИН</span>
                    <input
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputMode="numeric"
                      className={`${inputClass} tracking-[0.3em]`}
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`flex h-10 w-10 items-center justify-center rounded-md border text-lg transition-colors ${
                        a === avatar ? 'border-primary bg-primary/10' : 'border-border bg-background'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                {addError && <p className="mt-3 text-sm text-destructive">{addError}</p>}
                <button
                  type="submit"
                  className="mt-5 w-full rounded-md bg-primary px-5 py-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary-foreground"
                >
                  Создать доступ
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-5 py-4 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-secondary"
              >
                <Icon name="Plus" size={15} strokeWidth={1.6} />
                Добавить ребёнка
              </button>
            )}
          </div>

          <div className="space-y-6">
            {active ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card p-5">
                  <div>
                    <p className="rubric text-muted-foreground">Вход ребёнка</p>
                    <p className="mt-1 font-display text-xl tracking-[0.16em]">{active.code}</p>
                    <p className="mt-1 text-[0.7rem] text-muted-foreground">ПИН: {active.pin}</p>
                  </div>
                  <button
                    onClick={() => copyCode(active)}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-primary-foreground transition-transform hover:scale-[1.03]"
                  >
                    <Icon name="Copy" size={14} strokeWidth={1.6} />
                    Скопировать
                  </button>
                </div>

                <div className="flex gap-2">
                  {TABS.map((tItem) => (
                    <button
                      key={tItem.id}
                      onClick={() => setTab(tItem.id)}
                      className={`flex-1 rounded-md border px-4 py-3 text-[0.66rem] font-medium uppercase tracking-[0.1em] transition-colors ${
                        tab === tItem.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:bg-secondary'
                      }`}
                    >
                      {tItem.label}
                    </button>
                  ))}
                </div>

                {tab === 'progress' && (
                  <>
                    <ParentHeatmap data={active.heatmap} name={active.name} />
                    <div className="rounded-md border border-border bg-card p-6">
                      <p className="rubric text-muted-foreground">Итог по темам</p>
                      {active.stats && active.stats.length ? (
                        <ul className="mt-5 space-y-4">
                          {active.stats.map((s) => (
                            <li key={s.topic}>
                              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                                <span>{s.topic}</span>
                                <span className="text-muted-foreground">
                                  {s.correct} из {s.total} — {s.percent}% верных
                                </span>
                              </div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                                <div
                                  className={`h-full rounded-full ${
                                    s.percent < 50 ? 'bg-destructive' : 'bg-primary'
                                  }`}
                                  style={{ width: `${s.percent}%` }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          Пока пусто. После первой капсулы здесь появятся темы и доля верных
                          ответов.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {tab === 'assign' && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <form
                      onSubmit={assign}
                      noValidate
                      className="rounded-md border border-border bg-card p-6"
                    >
                      <p className="rubric text-muted-foreground">Назначить задание</p>
                      <label className="mt-5 block text-sm">
                        <span className="text-muted-foreground">Предмет</span>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className={inputClass}
                        >
                          {SUBJECTS.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <label className="mt-4 block text-sm">
                        <span className="text-muted-foreground">
                          Тема для {active.grade} класса
                        </span>
                        <select
                          value={selectedTopic?.slug || ''}
                          onChange={(e) => setTopicId(e.target.value)}
                          className={inputClass}
                        >
                          {availableTopics.map((t) => (
                            <option key={t.slug} value={t.slug}>
                              {t.label} ({t.count})
                            </option>
                          ))}
                        </select>
                      </label>
                      {!availableTopics.length && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Для этого класса по предмету тем нет — выберите другой предмет.
                        </p>
                      )}
                      <label className="mt-4 block text-sm">
                        <span className="text-muted-foreground">Дедлайн</span>
                        <input
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <div className="mt-5">
                        <span className="text-sm text-muted-foreground">
                          Капсула: <b className="text-foreground">{minutes} мин</b>
                        </span>
                        <div className="mt-3 flex gap-2">
                          {[10, 15, 20, 30].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMinutes(m)}
                              className={`rounded-md border px-4 py-2 text-xs font-medium transition-colors ${
                                m === minutes
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border bg-background hover:bg-secondary'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedTopic && (
                        <p className="mt-5 rounded-md border border-border bg-background px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Модуль: </span>
                          {selectedTopic.module} · в капсуле {Math.max(5, Math.round(minutes * 0.8))}{' '}
                          заданий из {selectedTopic.count}
                        </p>
                      )}
                      {assignError && (
                        <p className="mt-3 text-sm text-destructive">{assignError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={!availableTopics.length}
                        className="mt-5 w-full rounded-md bg-primary px-6 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
                      >
                        Назначить {active.name}
                      </button>
                    </form>

                    <div className="rounded-md border border-border bg-card p-6">
                      <p className="rubric text-muted-foreground">Уже назначено</p>
                      {childAssignments.length ? (
                        <ul className="mt-5 space-y-4">
                          {childAssignments.map((a) => (
                            <li key={a.id} className="border-b border-border pb-4 last:border-b-0">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="font-display text-base uppercase tracking-[0.04em]">
                                  {a.topic}
                                </span>
                                <span
                                  className={`rounded-sm px-2 py-1 text-[0.62rem] uppercase tracking-[0.12em] ${
                                    a.status === 'done'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary text-muted-foreground'
                                  }`}
                                >
                                  {a.status === 'done' ? 'Сдано' : 'В работе'}
                                </span>
                              </div>
                              <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                                {a.module} · до {a.deadline} · {a.minutes} мин
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          Заданий пока нет. Выберите тему слева и поставьте дедлайн.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'shop' && (
                  <ParentShop parent={parent} shop={shop} invites={invites} onChange={load} />
                )}
              </>
            ) : (
              <div className="rounded-md border border-border bg-card p-10 text-center">
                <p className="animate-float text-5xl">🐼</p>
                <p className="mt-5 font-display text-xl uppercase tracking-[0.05em]">
                  Добавьте первого ребёнка
                </p>
                <p className="mx-auto mt-3 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
                  Система выдаст код и ПИН — по ним ребёнок зайдёт в игру со своего устройства.
                  Первый тест бесплатный.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentCabinet;