/**
 * Editorial hand-inked underline. Wraps display text and draws a slightly
 * uneven brush stroke beneath it. The stroke animates in (stroke-dashoffset)
 * the first time an ancestor gets `.reveal-in` — see globals.css.
 *
 * Pure markup; no client JS. The gradient id is shared across instances
 * (identical defs resolve to the first match).
 */
export default function InkUnderline({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`ink-uline ${className}`}>
      {children}
      <svg
        className="ink-uline__svg"
        viewBox="0 0 300 10"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="ink-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        {/* Gentle, even hand-drawn wave (sits behind the text). Smooth
            quadratic + reflected T segments keep the humps consistent. */}
        <path
          className="ink-uline__stroke"
          pathLength={1}
          d="M2 5 Q 26 2.6 50 5 T 98 5 T 146 5 T 194 5 T 242 5 T 298 5"
        />
      </svg>
    </span>
  );
}
