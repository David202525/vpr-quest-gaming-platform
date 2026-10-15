import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import CabinetHeader from '@/components/CabinetHeader';
import ParentShop from '@/components/cabinet/ParentShop';
import ParentBackground from '@/components/cabinet/ParentBackground';
import ParentHero from '@/components/cabinet/ParentHero';
import ParentChildrenList from '@/components/cabinet/ParentChildrenList';
import ParentProgressTab from '@/components/cabinet/ParentProgressTab';
import ParentAssignTab from '@/components/cabinet/ParentAssignTab';
import { useAuth } from '@/contexts/AuthContext';
import { api, Assignment, Child, Invite, Parent, ShopItem } from '@/lib/api';
import { DbTopic } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

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
        <ParentHero parent={parent} />

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          <ParentChildrenList
            children={children}
            activeId={activeId}
            setActiveId={setActiveId}
            addOpen={addOpen}
            setAddOpen={setAddOpen}
            addChild={addChild}
            childName={childName}
            setChildName={setChildName}
            grade={grade}
            setGrade={setGrade}
            pin={pin}
            setPin={setPin}
            avatar={avatar}
            setAvatar={setAvatar}
            addError={addError}
            inputClass={inputClass}
          />

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

                {tab === 'progress' && <ParentProgressTab active={active} />}

                {tab === 'assign' && (
                  <ParentAssignTab
                    active={active}
                    assign={assign}
                    subject={subject}
                    setSubject={setSubject}
                    selectedTopic={selectedTopic}
                    setTopicId={setTopicId}
                    availableTopics={availableTopics}
                    deadline={deadline}
                    setDeadline={setDeadline}
                    minutes={minutes}
                    setMinutes={setMinutes}
                    assignError={assignError}
                    childAssignments={childAssignments}
                    inputClass={inputClass}
                  />
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
