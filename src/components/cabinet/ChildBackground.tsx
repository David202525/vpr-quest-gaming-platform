const HEROES = [
  { e: '🛡️', top: '8%', left: '5%', size: 'text-6xl', dur: '24s', delay: '0s' },
  { e: '🧑‍🍳', top: '22%', left: '86%', size: 'text-5xl', dur: '28s', delay: '2s' },
  { e: '🌱', top: '58%', left: '3%', size: 'text-5xl', dur: '20s', delay: '1s' },
  { e: '🗡️', top: '72%', left: '90%', size: 'text-6xl', dur: '26s', delay: '3s' },
  { e: '🤖', top: '40%', left: '12%', size: 'text-4xl', dur: '30s', delay: '4s' },
  { e: '🐼', top: '86%', left: '18%', size: 'text-5xl', dur: '23s', delay: '1.5s' },
  { e: '🐦‍⬛', top: '12%', left: '62%', size: 'text-4xl', dur: '27s', delay: '2.5s' },
  { e: '⭐', top: '48%', left: '78%', size: 'text-3xl', dur: '19s', delay: '0.5s' },
  { e: '🪙', top: '66%', left: '46%', size: 'text-3xl', dur: '21s', delay: '3.5s' },
  { e: '🐲', top: '92%', left: '70%', size: 'text-5xl', dur: '25s', delay: '0.8s' },
];

const ChildBackground = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
    <div className="absolute inset-0 bg-background" />
    <div className="absolute -left-[15%] top-[-10%] h-[52vw] w-[52vw] animate-aurora rounded-full bg-primary/20 blur-[90px]" />
    <div
      className="absolute -right-[12%] top-[35%] h-[46vw] w-[46vw] animate-aurora rounded-full bg-destructive/15 blur-[100px]"
      style={{ animationDelay: '5s' }}
    />
    <div
      className="absolute bottom-[-15%] left-[28%] h-[40vw] w-[40vw] animate-aurora rounded-full bg-primary/15 blur-[90px]"
      style={{ animationDelay: '9s' }}
    />

    {HEROES.map((h, i) => (
      <span
        key={i}
        className={`absolute animate-drift select-none opacity-[0.16] ${h.size}`}
        style={{
          top: h.top,
          left: h.left,
          animationDuration: h.dur,
          animationDelay: h.delay,
        }}
      >
        {h.e}
      </span>
    ))}
  </div>
);

export default ChildBackground;
