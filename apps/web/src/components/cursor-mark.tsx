type CursorMarkProps = {
  className?: string;
  size?: number;
  /** Official asset from Cursor Ambassador Studio brand kit */
  variant?: "cube-2d" | "cube-25d";
};

const SRC = {
  "cube-2d": "/brand/cursor/cube-2d-light.svg",
  "cube-25d": "/brand/cursor/cube-25d.svg",
} as const;

/** Official Cursor cube mark (light theme) for use on light backgrounds. */
export function CursorMark({
  className,
  size = 18,
  variant = "cube-2d",
}: CursorMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local brand SVG from Ambassador Studio
    <img
      src={SRC[variant]}
      alt=""
      width={size}
      height={size}
      className={className}
      decoding="async"
    />
  );
}
