import { Assignment, Child, DbTopic } from '@/lib/api';
import { SUBJECTS } from '@/data/curriculum';

interface Props {
  active: Child;
  assign: (e: React.FormEvent) => void;
  subject: string;
  setSubject: (v: string) => void;
  selectedTopic: DbTopic | undefined;
  setTopicId: (v: string) => void;
  availableTopics: DbTopic[];
  deadline: string;
  setDeadline: (v: string) => void;
  minutes: number;
  setMinutes: (v: number) => void;
  assignError: string;
  childAssignments: Assignment[];
  inputClass: string;
}

const ParentAssignTab = ({
  active,
  assign,
  subject,
  setSubject,
  selectedTopic,
  setTopicId,
  availableTopics,
  deadline,
  setDeadline,
  minutes,
  setMinutes,
  assignError,
  childAssignments,
  inputClass,
}: Props) => (
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
);

export default ParentAssignTab;
