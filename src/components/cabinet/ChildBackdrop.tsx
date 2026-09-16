const HEROES = [
  { e: '🛡️', top: '12%', left: '6%', size: 'text-6xl', anim: 'animate-drift', delay: '0s' },
  { e: '🧑‍🍳', top: '68%', left: '4%', size: 'text-5xl', anim: 'animate-float', delay: '1.2s' },
  { e: '🌱', top: '34%', left: '89%', size: 'text-6xl', anim: 'animate-sway', delay: '0.6s' },
  { e: '🗡️', top: '78%', left: '86%', size: 'text-5xl', anim: 'animate-drift', delay: '2.4s' },
  { e: '🤖', top: '52%', left: '93%', size: 'text-4xl', anim: 'animate-float', delay: '3s' },
  { e: '🦊', top: '86%', left: '46%', size: 'text-4xl', anim: 'animate-sway', delay: '1.8s' },
  { e: '🐲', top: '6%', left: '78%', size: 'text-5xl', anim: 'animate-drift', delay: '4s' },
  { e: '⭐', top: '24%', left: '40%', size: 'text-3xl', anim: 'animate-pulse-soft', delay: '0.3s' },
  { e: '⭐', top: '60%', left: '22%', size: 'text-2xl', anim: 'animate-pulse-soft', delay: '2s' },
  { e: '✨', top: '16%', left: '62%', size: 'text-3xl', anim: 'animate-pulse-soft', delay: '3.5s' },
];

const ChildBackdrop = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,hsl(var(--primary)/0.16),transparent_46%),radial-gradient(circle_at_84%_78%,hsl(var(--canvas)/0.4),transparent_52%)]" />
    <div className="paper-grain absolute inset-0 opacity-70" />

    <div className="absolute left-[-10%] top-[18%] h-64 w-64 animate-drift rounded-full bg-primary/10 blur-3xl" />
    <div
      className="absolute right-[-8%] top-[54%] h-72 w-72 animate-drift rounded-full bg-canvas/25 blur-3xl"
      style={{ animationDelay: '6s' }}
    />

    <div className="absolute top-[8%] w-full">
      <span className="inline-block animate-cross text-4xl opacity-30">☁️</span>
    </div>
    <div className="absolute top-[42%] w-full">
      <span
        className="inline-block animate-cross text-3xl opacity-20"
        style={{ animationDelay: '14s' }}
      >
        🪁
      </span>
    </div>

    {HEROES.map((h, i) => (
      <span
        key={`${h.e}-${i}`}
        className={`absolute select-none opacity-[0.22] ${h.size} ${h.anim}`}
        style={{ top: h.top, left: h.left, animationDelay: h.delay }}
      >
        {h.e}
      </span>
    ))}
  </div>
);

export default ChildBackdrop;
