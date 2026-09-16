import { Link, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

const CabinetHeader = ({ title }: { title: string }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-[50px] items-stretch rounded-md border border-border bg-card">
      <Link
        to="/"
        className="flex w-[108px] flex-none items-center justify-center border-r border-border font-display text-[0.95rem]"
      >
        <span className="border-b border-foreground pb-[2px]">ВПР-Quest</span>
      </Link>
      <div className="flex flex-1 items-center border-r border-border px-5 text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </div>
      <button
        onClick={async () => {
          await logout();
          navigate('/login');
        }}
        className="flex items-center gap-2 px-5 text-[0.68rem] font-medium uppercase tracking-[0.12em] transition-colors hover:bg-secondary"
      >
        <Icon name="LogOut" size={15} strokeWidth={1.4} />
        <span className="hidden sm:inline">Выйти</span>
      </button>
    </header>
  );
};

export default CabinetHeader;
