import Icon from '@/components/ui/icon';
import { Heatmap } from '@/lib/api';

const color = (v: number) => {
  if (v >= 60) return 'bg-destructive text-destructive-foreground';
  if (v >= 40) return 'bg-destructive/60 text-destructive-foreground';
  if (v >= 20) return 'bg-primary/45';
  return 'bg-primary/15';
};

const LEVEL_ICON: Record<string, string> = {
  alert: 'TriangleAlert',
  warn: 'CircleAlert',
  good: 'CircleCheck',
  info: 'Info',
};

const LEVEL_STYLE: Record<string, string> = {
  alert: 'border-destructive/50 bg-destructive/5 text-destructive',
  warn: 'border-primary/50 bg-primary/5 text-primary',
  good: 'border-primary/40 bg-primary/5 text-primary',
  info: 'border-border bg-background text-muted-foreground',
};

const ParentHeatmap = ({ data, name }: { data?: Heatmap; name: string }) => {
  const topics = data?.topics || [];
  const insights = data?.insights || [];
  const maxCells = Math.max(1, ...topics.map((t) => t.cells.length));

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="border-b border-border p-6">
        <p className="rubric text-muted-foreground">Тепловая карта ошибок · {name}</p>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
          Каждая клетка — одна пройденная капсула. Чем темнее, тем больше ошибок. Система сама
          разбирает карту и пишет выводы ниже.
        </p>

        {topics.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-1">
              <tbody>
                {topics.map((t) => (
                  <tr key={t.topic}>
                    <td className="w-[46%] pr-3 align-middle text-sm">
                      <span className="block leading-tight">{t.topic}</span>
                      <span className="block text-[0.68rem] text-muted-foreground">{t.module}</span>
                    </td>
                    {Array.from({ length: maxCells }).map((_, i) => {
                      const cell = t.cells[i];
                      return (
                        <td key={i} className="p-0">
                          {cell ? (
                            <div
                              title={`${t.topic}: ${cell.errors}% ошибок (${cell.correct} из ${cell.total})`}
                              className={`flex h-10 items-center justify-center rounded-sm text-[0.68rem] font-medium transition-transform hover:scale-105 ${color(
                                cell.errors,
                              )}`}
                            >
                              {cell.errors}%
                            </div>
                          ) : (
                            <div className="h-10 rounded-sm border border-dashed border-border" />
                          )}
                        </td>
                      );
                    })}
                    <td className="w-16 pl-3 text-right align-middle">
                      <span className="font-display text-lg">{t.avg_errors}%</span>
                      <span className="block text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground">
                        средне
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            Карта появится после первой пройденной капсулы.
          </p>
        )}
      </div>

      <div className="p-6">
        <p className="rubric text-muted-foreground">Что видит система</p>
        <ul className="mt-5 space-y-3">
          {insights.map((ins, i) => (
            <li
              key={`${ins.title}-${i}`}
              className={`flex items-start gap-3 rounded-md border p-4 ${LEVEL_STYLE[ins.level]}`}
            >
              <Icon
                name={LEVEL_ICON[ins.level]}
                size={17}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0"
              />
              <div>
                <p className="text-sm font-medium">{ins.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ins.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ParentHeatmap;
