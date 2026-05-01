export type IconName =
  | "moon"
  | "sun"
  | "system"
  | "info"
  | "timeline"
  | "heatmap"
  | "watch"
  | "lock";

type IconProps = {
  name: IconName;
  className?: string;
};

export function Icon({ name, className }: IconProps) {
  switch (name) {
    case "moon":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            d="M16 3.5a8.5 8.5 0 1 0 4.5 15.7A9.5 9.5 0 0 1 16 3.5Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <circle
            cx="12"
            cy="12"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "system":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <rect
            x="4"
            y="5"
            width="16"
            height="11"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9 20h6M12 16v4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 10v6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="7.25" r="1" fill="currentColor" />
        </svg>
      );
    case "timeline":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            d="M4 18h16"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <path
            d="M6.5 15.5 10 12l3 2 4.5-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "heatmap":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <rect
            x="4.5"
            y="5.5"
            width="15"
            height="14"
            rx="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 4.5v3M16 4.5v3M4.5 9.5h15"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <path d="M8 13h2v2H8zm3 0h2v2h-2zm3 0h2v2h-2z" fill="currentColor" />
        </svg>
      );
    case "watch":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <rect
            x="8"
            y="6"
            width="8"
            height="12"
            rx="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M10 3.5h4M10 20.5h4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <rect
            x="6"
            y="10"
            width="12"
            height="9"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9 10V8a3 3 0 1 1 6 0v2"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}
