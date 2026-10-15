import Icon from '@/components/ui/icon';
import { Child } from '@/lib/api';
import { GRADES } from '@/data/curriculum';

const AVATARS = ['🐼', '🤖', '🦊', '🐦‍⬛', '🐱', '🐲'];

interface Props {
  children: Child[];
  activeId: number | null;
  setActiveId: (id: number) => void;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  addChild: (e: React.FormEvent) => void;
  childName: string;
  setChildName: (v: string) => void;
  grade: string;
  setGrade: (v: string) => void;
  pin: string;
  setPin: (v: string) => void;
  avatar: string;
  setAvatar: (v: string) => void;
  addError: string;
  inputClass: string;
}

const ParentChildrenList = ({
  children,
  activeId,
  setActiveId,
  addOpen,
  setAddOpen,
  addChild,
  childName,
  setChildName,
  grade,
  setGrade,
  pin,
  setPin,
  avatar,
  setAvatar,
  addError,
  inputClass,
}: Props) => (
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
);

export default ParentChildrenList;
