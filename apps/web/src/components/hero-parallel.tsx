export function HeroParallel() {
  return (
    <figure className="relative mt-10 overflow-hidden border border-line">
      <div className="relative">
        <img
          src="/brand/hero-parallel.jpg"
          alt="Four parallel glass planes receding — identity, policy, audit, and containment as separate control surfaces"
          width={1600}
          height={900}
          className="block h-auto w-full"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 56"
          preserveAspectRatio="none"
          aria-hidden
        >
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={i}
              x1={4 + i * 7}
              y1="0"
              x2={4 + i * 7}
              y2="56"
              stroke="#0f766e"
              strokeOpacity="0.18"
              strokeWidth="0.35"
            />
          ))}
        </svg>
      </div>
      <figcaption className="border-t border-line bg-surface px-4 py-3 font-mono text-[11px] leading-5 text-muted">
        Parallel control planes — identity, policy, audit, containment. The prompt
        is not one of them.
      </figcaption>
    </figure>
  );
}
