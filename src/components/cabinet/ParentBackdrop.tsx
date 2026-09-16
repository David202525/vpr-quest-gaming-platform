const ParentBackdrop = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(160deg,hsl(var(--background))_0%,hsl(var(--secondary)/0.55)_58%,hsl(var(--background))_100%)]" />
    <div className="paper-grain absolute inset-0 opacity-60" />

    <div className="absolute left-[-12%] top-[-8%] h-[420px] w-[420px] animate-drift rounded-full bg-primary/[0.07] blur-3xl" />
    <div
      className="absolute right-[-14%] top-[38%] h-[460px] w-[460px] animate-drift rounded-full bg-canvas/20 blur-3xl"
      style={{ animationDelay: '8s' }}
    />

    <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] [background-size:96px_96px]" />

    <svg
      className="absolute bottom-0 left-0 w-full opacity-[0.07]"
      viewBox="0 0 1440 240"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M0 180 C 240 120, 360 210, 600 150 S 1020 90, 1440 160 L1440 240 L0 240 Z"
        fill="hsl(var(--foreground))"
      />
    </svg>
  </div>
);

export default ParentBackdrop;
