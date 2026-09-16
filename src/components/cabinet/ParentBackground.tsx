const ParentBackground = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
    <div className="absolute inset-0 bg-background" />
    <div className="absolute -left-[18%] top-[-14%] h-[48vw] w-[48vw] animate-aurora rounded-full bg-primary/12 blur-[110px]" />
    <div
      className="absolute -right-[16%] bottom-[-18%] h-[44vw] w-[44vw] animate-aurora rounded-full bg-primary/10 blur-[120px]"
      style={{ animationDelay: '7s' }}
    />
    <div
      className="absolute inset-0 opacity-[0.5]"
      style={{
        backgroundImage:
          'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse at 50% 0%, #000 20%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, #000 20%, transparent 78%)',
      }}
    />
  </div>
);

export default ParentBackground;
