import ParentHeatmap from '@/components/cabinet/ParentHeatmap';
import { Child } from '@/lib/api';

interface Props {
  active: Child;
}

const ParentProgressTab = ({ active }: Props) => (
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
);

export default ParentProgressTab;
