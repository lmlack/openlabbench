/**
 * The gwark.dev mark, from assets/mark.svg in that project. Brand teal is kept
 * in both themes rather than recolored to the local palette; it is the one
 * element on the page that belongs to the parent site.
 */
export function GwarkMark({ className = "size-6" }: { className?: string }) {
  const teeth = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="-70 -70 140 140" className={className} role="img" aria-label="gwark.dev">
      <g
        fill="none"
        stroke="#15897a"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {teeth.map((deg) => (
          <rect
            key={deg}
            x="-5.5"
            y="-66"
            width="11"
            height="17"
            rx="2.5"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="51" />
        <circle r="33" />
        <path d="M-30 -14 C -6 -30, 18 -32, 31 -18" />
        <g transform="rotate(-24)">
          <ellipse rx="67" ry="25" />
          <circle cx="62" cy="-9" r="7.5" />
          <circle cx="-17" cy="20" r="7.5" />
        </g>
      </g>
    </svg>
  );
}
