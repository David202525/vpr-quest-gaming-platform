import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { CARS, ITEMS, VIPS, Reward, RewardType, previewSrc, rewardImage, bpApi } from "@/lib/bpApi";

const TYPES: { v: RewardType; n: string }[] = [
  { v: "", n: "Нет награды" },
  { v: "money", n: "Деньги $" },
  { v: "coins", n: "Коины RC" },
  { v: "item", n: "Предмет" },
  { v: "vehicle", n: "Машина" },
  { v: "vip", n: "VIP" },
];
const RARE = [
  { v: "", n: "Обычная" },
  { v: "rare", n: "Редкая" },
  { v: "epic", n: "Эпическая" },
  { v: "legend", n: "Легендарная" },
];

const sel = "h-9 w-full rounded-md border border-sky-300/20 bg-[#0b1726] px-2 text-sm text-white";

type Props = { value: Reward | null; onChange: (r: Reward | null) => void; password: string };

export default function RewardEditor({ value, onChange, password }: Props) {
  const r: Reward = value || { type: "" };
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<Reward>) => {
    const n = { ...r, ...p };
    onChange(n.type ? n : null);
  };
  const changeType = (t: RewardType) => {
    if (!t) return onChange(null);
    const base: Reward = { type: t, rare: r.rare, title: "", image: "" };
    if (t === "money") base.amount = 10000;
    if (t === "coins") base.amount = 100;
    if (t === "item") Object.assign(base, { item: "medkit", count: 1 });
    if (t === "vehicle") Object.assign(base, { model: "sultan", rare: "legend" });
    if (t === "vip") Object.assign(base, { vip: "silver", days: 7 });
    onChange(base);
  };
  const upload = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      set({ image: await bpApi.upload(password, f) });
    } finally {
      setBusy(false);
    }
  };
  const img = rewardImage(value);

  return (
    <div className="space-y-2">
      <div className="flex h-24 items-center justify-center overflow-hidden rounded-md bg-gradient-to-b from-[#1a283a] to-[#0e1622]">
        {img ? <img src={previewSrc(img)} className="max-h-full max-w-full object-contain" onError={(e) => (e.currentTarget.style.opacity = "0.15")} /> : <Icon name="Ban" className="text-white/20" />}
      </div>
      <select className={sel} value={r.type} onChange={(e) => changeType(e.target.value as RewardType)}>
        {TYPES.map((t) => <option key={t.v} value={t.v}>{t.n}</option>)}
      </select>
      {(r.type === "money" || r.type === "coins") && (
        <Input type="number" value={r.amount || 0} onChange={(e) => set({ amount: Number(e.target.value) })} className="h-9 bg-[#0b1726]" />
      )}
      {r.type === "item" && (
        <div className="flex gap-2">
          <select className={sel} value={r.item} onChange={(e) => set({ item: e.target.value })}>
            {Object.entries(ITEMS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
          <Input type="number" min={1} value={r.count || 1} onChange={(e) => set({ count: Number(e.target.value) })} className="h-9 w-16 bg-[#0b1726]" />
        </div>
      )}
      {r.type === "vehicle" && (
        <>
          <Input list="bp-cars" value={r.model || ""} onChange={(e) => set({ model: e.target.value.trim() })} placeholder="Модель (sultan)" className="h-9 bg-[#0b1726]" />
          <datalist id="bp-cars">{CARS.map((c) => <option key={c} value={c} />)}</datalist>
        </>
      )}
      {r.type === "vip" && (
        <div className="flex gap-2">
          <select className={sel} value={r.vip} onChange={(e) => set({ vip: e.target.value })}>
            {Object.entries(VIPS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
          <Input type="number" min={1} value={r.days || 7} onChange={(e) => set({ days: Number(e.target.value) })} className="h-9 w-16 bg-[#0b1726]" title="Дней" />
        </div>
      )}
      {r.type && (
        <>
          <Input value={r.title || ""} onChange={(e) => set({ title: e.target.value })} placeholder="Своё название (необязательно)" className="h-9 bg-[#0b1726]" />
          <select className={sel} value={r.rare || ""} onChange={(e) => set({ rare: e.target.value })}>
            {RARE.map((t) => <option key={t.v} value={t.v}>{t.n}</option>)}
          </select>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
            <Button type="button" size="sm" variant="secondary" className="flex-1" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Icon name={busy ? "Loader2" : "ImagePlus"} size={14} className={busy ? "animate-spin" : ""} />
              {r.image ? "Сменить фото" : "Своё фото"}
            </Button>
            {r.image && (
              <Button type="button" size="sm" variant="ghost" onClick={() => set({ image: "" })} title="Убрать фото">
                <Icon name="X" size={14} />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
