const URL = "https://functions.poehali.dev/2f8ea274-a678-4f83-a4f3-9935b119e601?bp=1";

export type RewardType = "money" | "coins" | "item" | "vehicle" | "vip" | "";
export type Reward = {
  type: RewardType;
  amount?: number;
  item?: string;
  count?: number;
  model?: string;
  vip?: string;
  days?: number;
  title?: string;
  image?: string;
  rare?: string;
};
export type Level = { free: Reward | null; premium: Reward | null };
export type BPConfig = {
  seasonId: string;
  title1: string;
  title2: string;
  edition: string;
  description: string;
  background: string;
  price: number;
  levelPrice: number;
  giftEnabled: boolean;
  minutesPerLevel: number;
  endsAt: string;
  levels: Level[];
};

async function post(body: Record<string, unknown>) {
  const r = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Ошибка");
  return d;
}

export const bpApi = {
  get: async (): Promise<BPConfig> => (await (await fetch(URL)).json()).config,
  login: (password: string) => post({ action: "login", password }),
  save: (password: string, config: BPConfig) => post({ action: "save", password, config }),
  reset: async (password: string): Promise<BPConfig> => (await post({ action: "reset", password })).config,
  upload: async (password: string, file: File): Promise<string> => {
    const data = await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    return (await post({ action: "upload", password, data, type: file.type })).url;
  },
};

export const ITEMS: Record<string, string> = {
  medkit: "Аптечка", bandage: "Бинт", pills: "Таблетки", armour: "Бронежилет", canister: "Канистра (+25 л)",
  repair: "Ремкомплект", lockpick: "Отмычка", cash: "Пачка денег", phone: "Телефон", cap: "Кепка", hat: "Шляпа",
  glasses: "Очки", mask: "Маска", bandana: "Бандана", chain: "Цепочка", watch: "Часы", gloves: "Перчатки",
  tshirt: "Футболка", shirt: "Рубашка", hoodie: "Худи", jeans: "Джинсы", shorts: "Шорты", sneakers: "Кроссовки",
  boots: "Ботинки", backpack: "Рюкзак (+20 кг)", pistol: "Пистолет", smg: "Micro SMG", rifle: "Assault Rifle MK2",
  knife: "Нож", bat: "Бита", ammo_pistol: "Патроны 9 mm", ammo_smg: "Патроны SMG", ammo_rifle: "Патроны 5,56 mm",
  radio: "Рация",
};

export const CARS = "baller4 buccaneer2 chino2 cog55 cog552 cognoscenti dukes elegy2 emperor faction2 fugitive gauntlet granger guardian huntley impaler jester kuruma kuruma2 manana mesa3 minivan2 moonbeam2 nightshade oracle2 patriot2 peyote primo2 sabregt2 savestra schafter2 schafter3 slamvan3 stretch sultan superd tailgater tornado tornado5 virgo3 voodoo windsor xls2".split(" ");

export const VIPS: Record<string, string> = { silver: "Silver VIP", gold: "Gold VIP", platinum: "Platinum VIP" };

const BIG = ["armour", "backpack", "medkit", "rifle"];

export function rewardImage(r: Reward | null): string {
  if (!r || !r.type) return "";
  if (r.image) return r.image;
  if (r.type === "money") return "img/bp_money.jpg";
  if (r.type === "coins") return "img/bp_coins.jpg";
  if (r.type === "vip") return "img/bp_crown.jpg";
  if (r.type === "vehicle") return `img/v/${(r.model || "").toLowerCase()}.webp`;
  if (r.type === "item") return BIG.includes(r.item || "") ? `img/bp_${r.item}.jpg` : `img/i/${r.item}.webp`;
  return "";
}

export function previewSrc(u: string) {
  if (!u) return "";
  return /^https?:/.test(u) ? u : `/rage/cef/ui/${u}`;
}

export function rewardText(r: Reward | null): string {
  if (!r || !r.type) return "Пусто";
  if (r.title) return r.title + (r.type === "item" && (r.count || 1) > 1 ? ` x${r.count}` : "");
  if (r.type === "money") return `$${(r.amount || 0).toLocaleString("en-US")}`;
  if (r.type === "coins") return `${r.amount || 0} RC`;
  if (r.type === "vip") return `${VIPS[r.vip || ""] || "VIP"} на ${r.days || 7} дн.`;
  if (r.type === "vehicle") return `Авто ${r.model || ""}`;
  if (r.type === "item") return `${ITEMS[r.item || ""] || r.item}${(r.count || 1) > 1 ? ` x${r.count}` : ""}`;
  return "";
}
