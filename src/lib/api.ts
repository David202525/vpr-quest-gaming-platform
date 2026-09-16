const AUTH_URL = 'https://functions.poehali.dev/f120bf85-e77e-4581-9432-a78236a9b1e1';
const CABINET_URL = 'https://functions.poehali.dev/cba152f1-fc6e-4b5a-ba0f-a2535f354048';
const ADMIN_URL = 'https://functions.poehali.dev/2f8ea274-a678-4f83-a4f3-9935b119e601';

const TOKEN_KEY = 'vpr_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const request = async (base: string, action: string, options: RequestInit = {}) => {
  const res = await fetch(`${base}?action=${action}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': getToken(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Что-то пошло не так');
  return data;
};

export type Parent = {
  id: number;
  name: string;
  email: string;
  is_admin?: boolean;
  energy?: number;
  plan?: string;
};
export type Child = {
  id: number;
  name: string;
  grade: string;
  avatar: string;
  coins: number;
  xp: number;
  energy?: number;
  code: string;
  pin?: string;
  free_used?: boolean;
  parent_energy?: number;
  plan?: string;
  stats?: TopicStat[];
  heatmap?: Heatmap;
};
export type HeatCell = { errors: number; date: string; correct: number; total: number };
export type HeatTopic = {
  topic: string;
  module: string;
  cells: HeatCell[];
  avg_errors: number;
  trend: number;
  attempts: number;
};
export type Insight = {
  level: 'alert' | 'warn' | 'good' | 'info';
  title: string;
  text: string;
  topic: string | null;
};
export type Heatmap = { topics: HeatTopic[]; insights: Insight[] };
export type ShopItem = {
  code: string;
  title: string;
  price: number;
  kind: string;
  energy?: number;
};
export type Invite = { id: number; code: string; email: string; status: string };
export type TopicStat = {
  topic: string;
  module: string;
  correct: number;
  total: number;
  percent: number;
};
export type Assignment = {
  id: number;
  child_id?: number;
  topic: string;
  module: string;
  deadline: string | null;
  minutes: number;
  status: string;
};

export const api = {
  me: () => request(AUTH_URL, 'me'),
  register: (body: { name: string; email: string; password: string }) =>
    request(AUTH_URL, 'register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request(AUTH_URL, 'login', { method: 'POST', body: JSON.stringify(body) }),
  childLogin: (body: { code: string; pin: string }) =>
    request(AUTH_URL, 'child-login', { method: 'POST', body: JSON.stringify(body) }),
  addChild: (body: { name: string; grade: string; pin: string; avatar: string }) =>
    request(AUTH_URL, 'add-child', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request(AUTH_URL, 'logout', { method: 'POST', body: '{}' }),
  parentDashboard: () => request(CABINET_URL, 'parent-dashboard'),
  childDashboard: () => request(CABINET_URL, 'child-dashboard'),
  assign: (body: {
    child_id: number;
    topic: string;
    module: string;
    deadline: string;
    minutes: number;
  }) => request(CABINET_URL, 'assign', { method: 'POST', body: JSON.stringify(body) }),
  submitResult: (body: {
    topic: string;
    module: string;
    correct: number;
    total: number;
    assignment_id?: number | null;
  }) => request(CABINET_URL, 'submit-result', { method: 'POST', body: JSON.stringify(body) }),
  startTest: () => request(CABINET_URL, 'start-test', { method: 'POST', body: '{}' }),
  buy: (code: string) =>
    request(CABINET_URL, 'buy', { method: 'POST', body: JSON.stringify({ code }) }),
  parentBuy: (code: string) =>
    request(CABINET_URL, 'parent-buy', { method: 'POST', body: JSON.stringify({ code }) }),
  invite: (email: string) =>
    request(CABINET_URL, 'invite', { method: 'POST', body: JSON.stringify({ email }) }),
  topics: () => request(CABINET_URL, 'topics'),
  quiz: (topic: string, minutes: number) =>
    request(CABINET_URL, `quiz&topic=${encodeURIComponent(topic)}&minutes=${minutes}`),
};

export const adminApi = {
  overview: () => request(ADMIN_URL, 'overview'),
  questions: (topic: string, search = '') =>
    request(
      ADMIN_URL,
      `questions&topic=${encodeURIComponent(topic)}&q=${encodeURIComponent(search)}`,
    ),
  addQuestion: (body: { topic: string; text: string; options: string[]; right: number }) =>
    request(ADMIN_URL, 'add-question', { method: 'POST', body: JSON.stringify(body) }),
  bulkAdd: (topic: string, text: string) =>
    request(ADMIN_URL, 'bulk-add', { method: 'POST', body: JSON.stringify({ topic, text }) }),
  toggleQuestion: (id: number) =>
    request(ADMIN_URL, 'toggle-question', { method: 'POST', body: JSON.stringify({ id }) }),
  addTopic: (body: {
    slug: string;
    label: string;
    subject: string;
    module: string;
    grades: string;
  }) => request(ADMIN_URL, 'add-topic', { method: 'POST', body: JSON.stringify(body) }),
};

export type DbTopic = {
  slug: string;
  label: string;
  subject: string;
  module: string;
  grades: string[] | string;
  count: number;
  is_active?: boolean;
};
export type AdminQuestion = {
  id: number;
  topic: string;
  text: string;
  options: string[];
  right: number;
  source: string;
  is_active: boolean;
};