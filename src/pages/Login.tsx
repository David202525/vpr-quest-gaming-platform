import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type Mode = 'parent-login' | 'parent-register' | 'child';

const Login = () => {
  const [mode, setMode] = useState<Mode>('parent-login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { loginParent, registerParent, loginChild } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'parent-login') {
        await loginParent(email.trim(), password);
        navigate('/cabinet');
      } else if (mode === 'parent-register') {
        if (name.trim().length < 2) throw new Error('Напишите имя');
        if (password.length < 6) throw new Error('Пароль от 6 символов');
        await registerParent(name.trim(), email.trim(), password);
        toast({ title: 'Кабинет создан', description: 'Добавьте ребёнка и назначьте первую тему.' });
        navigate('/cabinet');
      } else {
        await loginChild(code.trim(), pin.trim());
        navigate('/game');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не получилось войти');
    }
    setBusy(false);
  };

  const inputClass =
    'mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary';

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 md:px-[30px] md:py-[22px]">
      <header className="flex h-[50px] items-center rounded-md border border-border bg-card px-6">
        <Link to="/" className="font-display text-[0.95rem] tracking-[0.01em]">
          <span className="border-b border-foreground pb-[2px]">ВПР-Quest</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-md">
          <p className="rubric text-primary">Вход</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3rem)] font-light uppercase leading-[1.05] tracking-[0.05em]">
            {mode === 'child' ? 'Вход для ученика' : 'Кабинет родителя'}
          </h1>

          <div className="mt-8 flex gap-2">
            <button
              onClick={() => {
                setMode('parent-login');
                setError('');
              }}
              className={`flex-1 rounded-md border px-4 py-3 text-[0.68rem] font-medium uppercase tracking-[0.12em] transition-colors ${
                mode !== 'child'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:bg-secondary'
              }`}
            >
              Родитель
            </button>
            <button
              onClick={() => {
                setMode('child');
                setError('');
              }}
              className={`flex-1 rounded-md border px-4 py-3 text-[0.68rem] font-medium uppercase tracking-[0.12em] transition-colors ${
                mode === 'child'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:bg-secondary'
              }`}
            >
              Ученик
            </button>
          </div>

          <form
            onSubmit={submit}
            noValidate
            className="mt-4 rounded-md border border-border bg-card p-6 md:p-8"
          >
            {mode === 'child' ? (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Введи код и ПИН, которые дали родители. Логин и почта не нужны.
                </p>
                <label className="mt-6 block text-sm">
                  <span className="text-muted-foreground">Код игрока</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="QST-AB12C"
                    className={`${inputClass} tracking-[0.18em]`}
                  />
                </label>
                <label className="mt-5 block text-sm">
                  <span className="text-muted-foreground">ПИН из 4 цифр</span>
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    inputMode="numeric"
                    placeholder="0000"
                    className={`${inputClass} tracking-[0.4em]`}
                  />
                </label>
              </>
            ) : (
              <>
                {mode === 'parent-register' && (
                  <label className="block text-sm">
                    <span className="text-muted-foreground">Ваше имя</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                )}
                <label className="mt-5 block text-sm first:mt-0">
                  <span className="text-muted-foreground">Почта</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="mt-5 block text-sm">
                  <span className="text-muted-foreground">Пароль</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </>
            )}

            {error && (
              <p className="mt-5 flex items-center gap-2 text-sm text-destructive">
                <Icon name="CircleAlert" size={15} strokeWidth={1.6} />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 w-full rounded-md bg-primary px-6 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {busy ? 'Проверяем…' : mode === 'parent-register' ? 'Создать кабинет' : 'Войти'}
            </button>

            {mode !== 'child' && (
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'parent-login' ? 'parent-register' : 'parent-login');
                  setError('');
                }}
                className="story-link mt-5 block text-[0.72rem] uppercase tracking-[0.12em] text-primary"
              >
                {mode === 'parent-login' ? 'Ещё нет кабинета — создать' : 'У меня уже есть кабинет'}
              </button>
            )}
          </form>

          <p className="mt-6 text-[0.72rem] leading-relaxed text-muted-foreground">
            Статистику ребёнка видит только родитель, у которого он добавлен. Другим пользователям
            данные недоступны.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
