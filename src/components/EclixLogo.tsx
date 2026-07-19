export function EclixLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="currentColor"
      className={className}
      aria-label="Eclix"
      role="img"
    >
      <g transform="rotate(0 100 100)">
        <path d="M100 100 C58 96, 56 42, 72 36 A28 28 0 1 1 128 36 C144 42, 142 96, 100 100 Z" />
      </g>
      <g transform="rotate(120 100 100)">
        <path d="M100 100 C58 96, 56 42, 72 36 A28 28 0 1 1 128 36 C144 42, 142 96, 100 100 Z" />
      </g>
      <g transform="rotate(240 100 100)">
        <path d="M100 100 C58 96, 56 42, 72 36 A28 28 0 1 1 128 36 C144 42, 142 96, 100 100 Z" />
      </g>
      <circle cx="100" cy="100" r="9" />
    </svg>
  );
}
