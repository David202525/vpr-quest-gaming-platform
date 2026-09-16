import type { Question } from './curriculum';

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffled = (right: number, wrong: number[]): { options: string[]; index: number } => {
  const pool = [right, ...wrong.filter((w) => w !== right)];
  const uniq = Array.from(new Set(pool)).slice(0, 4);
  while (uniq.length < 4) {
    const extra = right + rnd(-9, 9);
    if (!uniq.includes(extra)) uniq.push(extra);
  }
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
  }
  return { options: uniq.map(String), index: uniq.indexOf(right) };
};

const make = (q: string, right: number, wrong: number[]): Question => {
  const { options, index } = shuffled(right, wrong);
  return { q, options, right: index };
};

export const genOrder = (): Question => {
  const kind = rnd(0, 2);
  if (kind === 0) {
    const a = rnd(2, 12);
    const b = rnd(2, 9);
    const c = rnd(2, 9);
    const right = a + b * c;
    return make(`${a} + ${b} · ${c} = ?`, right, [(a + b) * c, a + b + c, a * b + c]);
  }
  if (kind === 1) {
    const b = rnd(2, 9);
    const c = rnd(2, 9);
    const sum = b + c;
    const a = sum * rnd(2, 6);
    const right = a / sum;
    return make(`${a} : (${b} + ${c}) = ?`, right, [a / b + c, a - sum, sum]);
  }
  const a = rnd(3, 12);
  const b = rnd(2, 9);
  const c = rnd(1, b - 1);
  const right = a * (b - c);
  return make(`${a} · (${b} − ${c}) = ?`, right, [a * b - c, a + b - c, a * b + c]);
};

export const genPercent = (): Question => {
  const kind = rnd(0, 2);
  if (kind === 0) {
    const p = [5, 10, 20, 25, 50][rnd(0, 4)];
    const base = rnd(2, 20) * 20;
    const right = (base * p) / 100;
    return make(`${p}% от ${base} — это…`, right, [base - right, right * 2, base / p]);
  }
  if (kind === 1) {
    const base = rnd(2, 12) * 100;
    const p = [10, 20, 25, 50][rnd(0, 3)];
    const right = base + (base * p) / 100;
    return make(`Цена ${base} ₽ выросла на ${p}%. Стало:`, right, [
      base - (base * p) / 100,
      base + p,
      base,
    ]);
  }
  const base = rnd(2, 12) * 100;
  const p = [10, 20, 25, 50][rnd(0, 3)];
  const right = base - (base * p) / 100;
  return make(`Скидка ${p}% на ${base} ₽. Платим:`, right, [
    base + (base * p) / 100,
    (base * p) / 100,
    base - p,
  ]);
};

export const genArea = (): Question => {
  const kind = rnd(0, 3);
  if (kind === 0) {
    const a = rnd(3, 15);
    return make(`Площадь квадрата со стороной ${a} см:`, a * a, [4 * a, 2 * a, a * a - a]);
  }
  if (kind === 1) {
    const a = rnd(2, 14);
    const b = rnd(2, 14);
    return make(`Периметр прямоугольника ${a} и ${b} см:`, 2 * (a + b), [a * b, a + b, 4 * a]);
  }
  if (kind === 2) {
    const a = rnd(2, 14);
    const b = rnd(2, 14);
    return make(`Площадь прямоугольника ${a} × ${b}:`, a * b, [2 * (a + b), a + b, a * b + a]);
  }
  const a = rnd(3, 15);
  return make(`Сторона квадрата ${a} м. Периметр:`, 4 * a, [a * a, 2 * a, 3 * a]);
};

export const genMotion = (): Question => {
  const kind = rnd(0, 3);
  const v = rnd(3, 12) * 10;
  const tHours = rnd(2, 6);
  if (kind === 0) {
    return make(`Скорость ${v} км/ч, время ${tHours} ч. Путь:`, v * tHours, [
      v + tHours,
      v - tHours,
      v * (tHours + 1),
    ]);
  }
  if (kind === 1) {
    const s = v * tHours;
    return make(`Путь ${s} км за ${tHours} ч. Скорость:`, v, [s - tHours, s / (tHours + 1), s]);
  }
  if (kind === 2) {
    const s = v * tHours;
    return make(`Путь ${s} км, скорость ${v} км/ч. Время:`, tHours, [
      tHours + 2,
      tHours - 1,
      s / 10,
    ]);
  }
  const v2 = rnd(3, 12) * 10;
  return make(`Навстречу: ${v} и ${v2} км/ч. Скорость сближения:`, v + v2, [
    Math.abs(v - v2),
    v,
    v2,
  ]);
};

export const genNegative = (): Question => {
  const kind = rnd(0, 3);
  const a = rnd(2, 15);
  const b = rnd(2, 15);
  if (kind === 0) return make(`−${a} + ${b} = ?`, b - a, [a - b, -(a + b), a + b]);
  if (kind === 1) return make(`−${a} · (−${b}) = ?`, a * b, [-(a * b), -(a + b), a + b]);
  if (kind === 2) return make(`${a} − (−${b}) = ?`, a + b, [a - b, b - a, -(a + b)]);
  return make(`−${a} − ${b} = ?`, -(a + b), [b - a, a - b, a + b]);
};

export const genEquation = (): Question => {
  const kind = rnd(0, 3);
  const x = rnd(2, 15);
  if (kind === 0) {
    const c = rnd(2, 20);
    return make(`x + ${c} = ${x + c}. x = ?`, x, [x + c, c, x + 2 * c]);
  }
  if (kind === 1) {
    const k = rnd(2, 9);
    return make(`${k}x = ${k * x}. x = ?`, x, [k * x, k + x, k * x - k]);
  }
  if (kind === 2) {
    const k = rnd(2, 6);
    const c = rnd(2, 12);
    return make(`${k}x − ${c} = ${k * x - c}. x = ?`, x, [x + c, k * x, x - 1]);
  }
  const k = rnd(2, 9);
  return make(`x : ${k} = ${x}. x = ?`, k * x, [x, x + k, x - k]);
};

export const genFraction = (): Question => {
  const kind = rnd(0, 2);
  if (kind === 0) {
    const d = [2, 3, 4, 5, 6][rnd(0, 4)];
    const k = rnd(2, 3);
    const a = rnd(1, d - 1);
    const b = rnd(1, d * k - 1);
    const num = a * k + b;
    const den = d * k;
    return {
      q: `${a}/${d} + ${b}/${den} = ?`,
      options: [`${num}/${den}`, `${a + b}/${d + den}`, `${num}/${d}`, `${a + b}/${den}`],
      right: 0,
    };
  }
  if (kind === 1) {
    const den = [4, 5, 6, 8, 9, 10][rnd(0, 5)];
    const a = rnd(2, den - 1);
    const b = rnd(1, a - 1);
    return {
      q: `${a}/${den} − ${b}/${den} = ?`,
      options: [`${a - b}/${den}`, `${a - b}/${den * 2}`, `${a + b}/${den}`, `${a}/${b}`],
      right: 0,
    };
  }
  const den = [2, 3, 4, 5, 6][rnd(0, 4)];
  const a = rnd(1, den - 1);
  const k = rnd(2, 6);
  const num = a * k;
  return {
    q: `${a}/${den} · ${k} = ?`,
    options: [`${num}/${den}`, `${a}/${den * k}`, `${num}/${den * k}`, `${a + k}/${den}`],
    right: 0,
  };
};

export const GENERATORS: Record<string, () => Question> = {
  order: genOrder,
  frac: genFraction,
  percent: genPercent,
  area: genArea,
  motion: genMotion,
  negative: genNegative,
  equation: genEquation,
};
