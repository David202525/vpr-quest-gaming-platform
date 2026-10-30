import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import RewardEditor from "@/components/bp/RewardEditor";
import { BPConfig, Reward, bpApi, previewSrc, rewardImage, rewardText } from "@/lib/bpApi";

const PKEY = "bp_admin_pwd";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-sky-100/70">{label}</Label>
      {children}
    </div>
  );
}

function Preview({ c }: { c: BPConfig }) {
  return (
    <div className="relative h-72 overflow-hidden rounded-xl border border-sky-200/30 bg-cover bg-center" style={{ backgroundImage: `url(${previewSrc(c.background)})` }}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#06101e]/90" />
      <h1 className="absolute left-6 top-4 skew-x-[-10deg] font-black italic uppercase text-white drop-shadow-[0_4px_20px_rgba(63,180,255,.7)]" style={{ fontSize: 46, fontFamily: "Unbounded, sans-serif" }}>{c.title1}</h1>
      <h1 className="absolute left-24 top-[72px] skew-x-[-10deg] font-black italic uppercase text-transparent" style={{ fontSize: 50, WebkitTextStroke: "2px #fff", fontFamily: "Unbounded, sans-serif" }}>{c.title2}</h1>
      <div className="absolute right-4 top-[140px] bg-gradient-to-r from-[#0a2850]/90 to-sky-400/30 px-5 py-2 text-xl font-bold tracking-[5px] text-white" style={{ clipPath: "polygon(6% 0,100% 0,94% 100%,0 100%)" }}>{c.edition}</div>
      <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-4">
        <p className="line-clamp-3 max-w-sm text-[11px] text-white/80">{c.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white"><i className="font-black text-sky-300">A</i> {c.price.toLocaleString("ru-RU")}</span>
          <span className="rounded bg-sky-100 px-3 py-2 text-[11px] font-extrabold uppercase text-[#062033]">Оформить</span>
          {c.giftEnabled && <span className="rounded bg-sky-200 px-3 py-2 text-[11px] font-extrabold uppercase text-[#062033]">Подарить</span>}
        </div>
      </div>
    </div>
  );
}

function Cell({ r, active, onClick }: { r: Reward | null; active: boolean; onClick: () => void }) {
  const img = rewardImage(r);
  const rare = r?.rare === "legend" ? "border-amber-400/60" : r?.rare === "epic" ? "border-violet-400/60" : r?.rare === "rare" ? "border-sky-400/60" : "border-white/10";
  return (
    <button onClick={onClick} className={`flex h-28 w-full flex-col items-center gap-1 rounded-lg border bg-gradient-to-b from-[#1a283a] to-[#0e1622] p-2 transition hover:-translate-y-0.5 ${rare} ${active ? "ring-2 ring-sky-300" : ""}`}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {img ? <img src={previewSrc(img)} className="max-h-16 max-w-full object-contain" onError={(e) => (e.currentTarget.style.opacity = "0.15")} /> : <Icon name="Plus" className="text-white/20" />}
      </div>
      <span className="line-clamp-2 text-[11px] leading-tight text-white/85">{rewardText(r)}</span>
    </button>
  );
}

export default function BattlePassAdmin() {
  const [pwd, setPwd] = useState(localStorage.getItem(PKEY) || "");
  const [authed, setAuthed] = useState(false);
  const [cfg, setCfg] = useState<BPConfig | null>(null);
  const [saved, setSaved] = useState("");
  const [sel, setSel] = useState<{ i: number; t: "free" | "premium" } | null>(null);
  const [saving, setSaving] = useState(false);
  const bgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bpApi.get().then((c) => { setCfg(c); setSaved(JSON.stringify(c)); });
    const p = localStorage.getItem(PKEY);
    if (p) bpApi.login(p).then(() => setAuthed(true)).catch(() => localStorage.removeItem(PKEY));
  }, []);

  const login = async () => {
    try {
      await bpApi.login(pwd);
      localStorage.setItem(PKEY, pwd);
      setAuthed(true);
    } catch {
      toast.error("Неверный пароль");
    }
  };

  const up = (p: Partial<BPConfig>) => setCfg((c) => (c ? { ...c, ...p } : c));
  const setReward = (i: number, t: "free" | "premium", r: Reward | null) =>
    setCfg((c) => (c ? { ...c, levels: c.levels.map((L, k) => (k === i ? { ...L, [t]: r } : L)) } : c));

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      await bpApi.save(pwd, cfg);
      setSaved(JSON.stringify(cfg));
      toast.success("Сохранено. На сервере обновится в течение 2 минут (или командой /bpreload)");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Вернуть все настройки пропуска по умолчанию?")) return;
    const c = await bpApi.reset(pwd);
    setCfg(c);
    setSaved(JSON.stringify(c));
    setSel(null);
  };

  const uploadBg = async (f?: File) => {
    if (!f) return;
    const url = await bpApi.upload(pwd, f);
    up({ background: url });
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06101e] bg-cover bg-center p-4" style={{ backgroundImage: "linear-gradient(rgba(6,16,30,.75),rgba(6,16,30,.9)),url(/rage/cef/ui/img/bp_winter.jpg)" }}>
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-sky-200/20 bg-[#0b1726]/90 p-8 text-white backdrop-blur">
          <div className="text-center">
            <Icon name="Snowflake" size={36} className="mx-auto mb-2 text-sky-300" />
            <h1 className="text-xl font-bold">Редактор зимнего пропуска</h1>
            <p className="text-sm text-white/60">Введите пароль администратора</p>
          </div>
          <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Пароль" className="bg-[#06101e]" />
          <Button className="w-full bg-sky-300 text-[#062033] hover:bg-sky-200" onClick={login}>Войти</Button>
        </div>
      </div>
    );
  }

  if (!cfg) return <div className="flex min-h-screen items-center justify-center bg-[#06101e] text-white">Загрузка...</div>;

  const dirty = JSON.stringify(cfg) !== saved;
  const cur = sel ? cfg.levels[sel.i]?.[sel.t] ?? null : null;

  return (
    <div className="min-h-screen bg-[#06101e] text-white">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sky-200/10 bg-[#06101e]/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Icon name="Snowflake" className="text-sky-300" />
          <b>Редактор пропуска</b>
          {dirty && <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs text-amber-300">Есть несохранённые изменения</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={reset}><Icon name="RotateCcw" size={14} />По умолчанию</Button>
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem(PKEY); setAuthed(false); }}><Icon name="LogOut" size={14} /></Button>
          <Button size="sm" className="bg-sky-300 text-[#062033] hover:bg-sky-200" disabled={!dirty || saving} onClick={save}>
            <Icon name={saving ? "Loader2" : "Save"} size={14} className={saving ? "animate-spin" : ""} />Сохранить
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Preview c={cfg} />

          <section className="rounded-xl border border-sky-200/10 bg-[#0b1726] p-5">
            <h2 className="mb-4 font-semibold">Оформление и цены</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Заголовок, строка 1"><Input value={cfg.title1} onChange={(e) => up({ title1: e.target.value })} className="bg-[#06101e]" /></Field>
              <Field label="Заголовок, строка 2"><Input value={cfg.title2} onChange={(e) => up({ title2: e.target.value })} className="bg-[#06101e]" /></Field>
              <Field label="Плашка издания"><Input value={cfg.edition} onChange={(e) => up({ edition: e.target.value })} className="bg-[#06101e]" /></Field>
              <Field label="Цена премиум-пропуска, RC"><Input type="number" value={cfg.price} onChange={(e) => up({ price: Number(e.target.value) })} className="bg-[#06101e]" /></Field>
              <Field label="Цена покупки 1 уровня, RC (0 — выкл.)"><Input type="number" value={cfg.levelPrice} onChange={(e) => up({ levelPrice: Number(e.target.value) })} className="bg-[#06101e]" /></Field>
              <Field label="Минут игры на 1 уровень"><Input type="number" value={cfg.minutesPerLevel} onChange={(e) => up({ minutesPerLevel: Number(e.target.value) })} className="bg-[#06101e]" /></Field>
              <Field label="Сезон заканчивается"><Input type="date" value={cfg.endsAt} onChange={(e) => up({ endsAt: e.target.value })} className="bg-[#06101e]" /></Field>
              <Field label="Код сезона (смена — сброс прогресса у всех)"><Input value={cfg.seasonId} onChange={(e) => up({ seasonId: e.target.value.trim() })} className="bg-[#06101e]" /></Field>
              <Field label="Подарок другу">
                <div className="flex h-10 items-center gap-2"><Switch checked={cfg.giftEnabled} onCheckedChange={(v) => up({ giftEnabled: v })} /><span className="text-sm text-white/70">{cfg.giftEnabled ? "Включён" : "Выключен"}</span></div>
              </Field>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
              <Field label="Описание"><Textarea rows={4} value={cfg.description} onChange={(e) => up({ description: e.target.value })} className="bg-[#06101e]" /></Field>
              <Field label="Фон">
                <input ref={bgRef} type="file" accept="image/*" hidden onChange={(e) => uploadBg(e.target.files?.[0])} />
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full" onClick={() => bgRef.current?.click()}><Icon name="ImagePlus" size={14} />Загрузить фон</Button>
                  <Button variant="ghost" className="w-full" onClick={() => up({ background: "img/bp_winter.jpg" })}>Зимний по умолчанию</Button>
                </div>
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-sky-200/10 bg-[#0b1726] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Уровни и награды ({cfg.levels.length})</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={cfg.levels.length <= 1} onClick={() => { up({ levels: cfg.levels.slice(0, -1) }); setSel(null); }}><Icon name="Minus" size={14} />Уровень</Button>
                <Button size="sm" variant="secondary" disabled={cfg.levels.length >= 100} onClick={() => up({ levels: [...cfg.levels, { free: null, premium: null }] })}><Icon name="Plus" size={14} />Уровень</Button>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3">
              <div className="flex shrink-0 flex-col gap-2 pt-6">
                <div className="flex h-28 w-8 items-center justify-center rounded bg-white/10 text-xs [writing-mode:vertical-rl] rotate-180">Обычный</div>
                <div className="flex h-28 w-8 items-center justify-center rounded bg-sky-500/40 text-xs [writing-mode:vertical-rl] rotate-180">Премиум</div>
              </div>
              {cfg.levels.map((L, i) => (
                <div key={i} className="w-32 shrink-0 space-y-2">
                  <div className="text-center text-xs font-bold text-sky-200">{String(i + 1).padStart(2, "0")}</div>
                  <Cell r={L.free} active={sel?.i === i && sel.t === "free"} onClick={() => setSel({ i, t: "free" })} />
                  <Cell r={L.premium} active={sel?.i === i && sel.t === "premium"} onClick={() => setSel({ i, t: "premium" })} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-sky-200/10 bg-[#0b1726] p-5">
            {sel ? (
              <>
                <h3 className="mb-3 font-semibold">Уровень {sel.i + 1} · {sel.t === "free" ? "обычный" : "премиум"}</h3>
                <RewardEditor key={`${sel.i}-${sel.t}`} value={cur} password={pwd} onChange={(r) => setReward(sel.i, sel.t, r)} />
              </>
            ) : (
              <div className="py-10 text-center text-sm text-white/50">
                <Icon name="MousePointerClick" className="mx-auto mb-2" />
                Нажмите на любую награду, чтобы изменить её
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
