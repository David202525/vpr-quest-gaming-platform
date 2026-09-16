import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const SAMPLE = `Решите уравнение: 5x + 7 = 42 | x = 7 | x = 9 | x = 5 | 1
Найдите 20% от 150 | 15 | 30 | 25 | 2`;

type Props = { topic: string; topicLabel: string; onDone: () => void };

const BulkUpload = ({ topic, topicLabel, onDone }: Props) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const lines = text.split('\n').filter((l) => l.trim()).length;

  const readFile = async (file: File) => {
    const raw = await file.text();
    const normalized = raw
      .split('\n')
      .map((l) => l.replace(/\t/g, ' | ').replace(/;/g, ' | '))
      .join('\n');
    setText((prev) => (prev ? `${prev}\n${normalized}` : normalized));
  };

  const send = async () => {
    setBusy(true);
    setErrors([]);
    try {
      const res = await adminApi.bulkAdd(topic, text);
      setErrors(res.errors || []);
      toast({
        title: `Добавлено: ${res.added}`,
        description: res.skipped
          ? `Пропущено дублей: ${res.skipped}`
          : 'Задания уже доступны в игре.',
      });
      if (res.added) {
        setText('');
        onDone();
      }
    } catch (err) {
      toast({
        title: 'Не получилось',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
    }
    setBusy(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-5 py-4 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-secondary"
      >
        <Icon name="Upload" size={15} strokeWidth={1.6} />
        Загрузить пачкой
      </button>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="rubric text-muted-foreground">Загрузка пачкой · {topicLabel}</p>
        <button
          onClick={() => setOpen(false)}
          className="text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground story-link"
        >
          Свернуть
        </button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Одна строка — одно задание. Сначала текст, затем варианты ответа, последним числом — номер
        правильного варианта. Разделитель — вертикальная черта.
      </p>

      <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-background p-4 text-[0.72rem] leading-relaxed text-muted-foreground">
        {SAMPLE}
      </pre>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] transition-colors hover:bg-secondary">
          <Icon name="FileUp" size={14} strokeWidth={1.6} />
          Файл CSV или TXT
          <input
            type="file"
            accept=".csv,.txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
              e.target.value = '';
            }}
          />
        </label>
        <span className="text-[0.72rem] text-muted-foreground">Строк готово: {lines}</span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Вставьте строки сюда"
        className="mt-4 w-full resize-y rounded-md border border-border bg-background px-4 py-3 font-mono text-[0.78rem] outline-none focus:border-primary"
      />

      {errors.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-4">
          {errors.map((e) => (
            <li key={e} className="text-sm text-destructive">
              {e}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={send}
        disabled={busy || !lines}
        className="mt-5 rounded-md bg-primary px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-60"
      >
        {busy ? 'Загружаем…' : `Загрузить ${lines} заданий`}
      </button>
    </div>
  );
};

export default BulkUpload;
