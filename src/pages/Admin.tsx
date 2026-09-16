import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import CabinetHeader from '@/components/CabinetHeader';
import ParentBackground from '@/components/cabinet/ParentBackground';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, AdminQuestion, DbTopic } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const SUBJECTS = ['Математика', 'Русский язык', 'Окружающий мир', 'История'];

const Admin = () => {
  const { role, parent, loading } = useAuth();
  const navigate = useNavigate();

  const [topics, setTopics] = useState<DbTopic[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState<string>('');
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [search, setSearch] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qRight, setQRight] = useState(0);
  const [qError, setQError] = useState('');

  const [newTopic, setNewTopic] = useState({
    slug: '',
    label: '',
    subject: 'Математика',
    module: 'Башня дробей',
    grades: '5,6',
  });
  const [topicOpen, setTopicOpen] = useState(false);

  useEffect(() => {
    if (!loading && role !== 'parent') navigate('/login');
  }, [loading, role, navigate]);

  const loadOverview = async () => {
    try {
      const data = await adminApi.overview();
      setTopics(data.topics);
      setTotal(data.total);
      setActive((cur) => cur || (data.topics[0]?.slug ?? ''));
    } catch {
      setDenied(true);
    }
    setDataLoading(false);
  };

  const loadQuestions = async (slug: string, q = '') => {
    if (!slug) return;
    try {
      const data = await adminApi.questions(slug, q);
      setQuestions(data.questions);
    } catch {
      /* no-op */
    }
  };

  useEffect(() => {
    if (role === 'parent') loadOverview();
  }, [role]);

  useEffect(() => {
    if (active) loadQuestions(active, search);
  }, [active]);

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQError('');
    const opts = qOptions.map((o) => o.trim()).filter(Boolean);
    if (qText.trim().length < 3 || opts.length < 2) {
      setQError('Нужен текст и минимум два варианта');
      return;
    }
    if (qRight >= opts.length) {
      setQError('Отметьте правильный вариант из заполненных');
      return;
    }
    try {
      await adminApi.addQuestion({
        topic: active,
        text: qText.trim(),
        options: opts,
        right: qRight,
      });
      setQText('');
      setQOptions(['', '', '', '']);
      setQRight(0);
      await Promise.all([loadOverview(), loadQuestions(active, search)]);
      toast({ title: 'Задание добавлено', description: 'Оно сразу доступно в игре.' });
    } catch (err) {
      setQError(err instanceof Error ? err.message : 'Не получилось добавить');
    }
  };

  const toggle = async (q: AdminQuestion) => {
    try {
      await adminApi.toggleQuestion(q.id);
      await Promise.all([loadOverview(), loadQuestions(active, search)]);
    } catch {
      toast({ title: 'Не получилось', variant: 'destructive' });
    }
  };

  const addTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.addTopic(newTopic);
      setTopicOpen(false);
      setNewTopic({ ...newTopic, slug: '', label: '' });
      await loadOverview();
      toast({ title: 'Тема создана' });
    } catch (err) {
      toast({
        title: 'Не получилось',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
    }
  };

  const inputClass =
    'mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary';

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Загружаем банк заданий…
      </div>
    );
  }

  if (denied || !parent?.is_admin) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <ParentBackground />
        <Icon name="Lock" size={28} strokeWidth={1.3} className="text-primary" />
        <p className="mt-5 font-display text-2xl uppercase tracking-[0.05em]">Раздел закрыт</p>
        <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
          Банк заданий доступен только администратору платформы.
        </p>
        <button
          onClick={() => navigate('/cabinet')}
          className="mt-7 rounded-md bg-primary px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary-foreground"
        >
          В кабинет
        </button>
      </div>
    );
  }

  const activeTopic = topics.find((t) => t.slug === active);

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-6 md:px-[30px] md:py-[22px]">
      <ParentBackground />
      <CabinetHeader title="Админка · банк заданий" />

      <main className="mx-auto mt-8 max-w-6xl pb-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rubric text-primary">Администратор</p>
            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.25rem)] font-light uppercase leading-[1.05] tracking-[0.05em]">
              Банк заданий
            </h1>
          </div>
          <div className="rounded-md border border-border bg-card px-5 py-4">
            <p className="rubric text-muted-foreground">Всего заданий</p>
            <p className="mt-1 font-display text-3xl">{total}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-card p-5">
              <p className="rubric text-muted-foreground">Темы ({topics.length})</p>
              <ul className="mt-4 max-h-[460px] space-y-1 overflow-y-auto pr-1">
                {topics.map((t) => (
                  <li key={t.slug}>
                    <button
                      onClick={() => setActive(t.slug)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                        t.slug === active
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <span className="leading-tight">
                        {t.label}
                        <span
                          className={`block text-[0.66rem] ${
                            t.slug === active ? 'opacity-80' : 'text-muted-foreground'
                          }`}
                        >
                          {t.subject} · {t.grades} кл.
                        </span>
                      </span>
                      <b className="shrink-0 font-display text-base">{t.count}</b>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {topicOpen ? (
              <form onSubmit={addTopic} className="rounded-md border border-border bg-card p-5">
                <p className="rubric text-muted-foreground">Новая тема</p>
                <label className="mt-4 block text-sm">
                  <span className="text-muted-foreground">Название</span>
                  <input
                    value={newTopic.label}
                    onChange={(e) => setNewTopic({ ...newTopic, label: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="mt-4 block text-sm">
                  <span className="text-muted-foreground">Код (латиницей)</span>
                  <input
                    value={newTopic.slug}
                    onChange={(e) =>
                      setNewTopic({ ...newTopic, slug: e.target.value.replace(/[^a-z0-9_]/g, '') })
                    }
                    placeholder="roots"
                    className={inputClass}
                  />
                </label>
                <label className="mt-4 block text-sm">
                  <span className="text-muted-foreground">Предмет</span>
                  <select
                    value={newTopic.subject}
                    onChange={(e) => setNewTopic({ ...newTopic, subject: e.target.value })}
                    className={inputClass}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-sm">
                  <span className="text-muted-foreground">Модуль</span>
                  <input
                    value={newTopic.module}
                    onChange={(e) => setNewTopic({ ...newTopic, module: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="mt-4 block text-sm">
                  <span className="text-muted-foreground">Классы через запятую</span>
                  <input
                    value={newTopic.grades}
                    onChange={(e) => setNewTopic({ ...newTopic, grades: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <button
                  type="submit"
                  className="mt-5 w-full rounded-md bg-primary px-5 py-3 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-primary-foreground"
                >
                  Создать тему
                </button>
              </form>
            ) : (
              <button
                onClick={() => setTopicOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-5 py-4 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-secondary"
              >
                <Icon name="Plus" size={15} strokeWidth={1.6} />
                Добавить тему
              </button>
            )}
          </div>

          <div className="space-y-6">
            <form onSubmit={addQuestion} className="rounded-md border border-border bg-card p-6">
              <p className="rubric text-muted-foreground">
                Новое задание · {activeTopic?.label || '—'}
              </p>
              <label className="mt-5 block text-sm">
                <span className="text-muted-foreground">Текст задания</span>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-y`}
                />
              </label>
              <p className="mt-5 text-sm text-muted-foreground">
                Варианты ответа — отметьте правильный
              </p>
              <div className="mt-3 space-y-2">
                {qOptions.map((o, i) => (
                  <label key={i} className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={qRight === i}
                      onChange={() => setQRight(i)}
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    <input
                      value={o}
                      onChange={(e) => {
                        const next = [...qOptions];
                        next[i] = e.target.value;
                        setQOptions(next);
                      }}
                      placeholder={`Вариант ${i + 1}`}
                      className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                ))}
              </div>
              {qError && <p className="mt-3 text-sm text-destructive">{qError}</p>}
              <button
                type="submit"
                disabled={!active}
                className="mt-5 rounded-md bg-primary px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-60"
              >
                Добавить задание
              </button>
            </form>

            <div className="rounded-md border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                <p className="rubric text-muted-foreground">
                  Задания темы · {questions.length}
                </p>
                <div className="flex gap-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по тексту"
                    className="rounded-md border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => loadQuestions(active, search)}
                    className="rounded-md bg-secondary px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.1em]"
                  >
                    Найти
                  </button>
                </div>
              </div>

              <ul className="divide-y divide-border">
                {questions.map((q) => (
                  <li key={q.id} className={`p-5 ${q.is_active ? '' : 'opacity-50'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="max-w-[70ch] text-sm">{q.text}</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-sm bg-secondary px-2 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
                          {q.source}
                        </span>
                        <button
                          onClick={() => toggle(q)}
                          className="rounded-md border border-border px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.1em] transition-colors hover:bg-secondary"
                        >
                          {q.is_active ? 'Скрыть' : 'Вернуть'}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {q.options.map((o, i) => (
                        <span
                          key={i}
                          className={`rounded-md px-3 py-1.5 text-[0.72rem] ${
                            i === q.right
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background text-muted-foreground'
                          }`}
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
                {!questions.length && (
                  <li className="p-6 text-sm text-muted-foreground">
                    Заданий по этой теме нет — добавьте первое сверху.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
