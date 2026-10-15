import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Parent } from '@/lib/api';

interface Props {
  parent: Parent | null;
}

const ParentHero = ({ parent }: Props) => {
  const navigate = useNavigate();

  return (
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
  );
};

export default ParentHero;
