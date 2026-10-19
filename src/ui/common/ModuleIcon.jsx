// Icônes des modules.

const MODULE_ICONS = {
  server: <>
    <rect x="4" y="3.5" width="16" height="7" rx="1.5" />
    <rect x="4" y="13.5" width="16" height="7" rx="1.5" />
    <circle cx="8" cy="7" r="1" fill="currentColor" />
    <circle cx="8" cy="17" r="1" fill="currentColor" />
    <path d="M12 7h5M12 17h5" />
  </>,
  database: <>
    <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
    <path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13" />
    <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
  </>,
  api: <>
    <path d="M8 4c-2 0-3 1-3 3v2.5c0 1-.8 2.5-2 2.5 1.2 0 2 1.5 2 2.5V17c0 2 1 3 3 3" />
    <path d="M16 4c2 0 3 1 3 3v2.5c0 1 .8 2.5 2 2.5-1.2 0-2 1.5-2 2.5V17c0 2-1 3-3 3" />
    <path d="M9.5 12h5M12.5 9.5 15 12l-2.5 2.5" />
  </>,
  analytics: <>
    <path d="M4 20h16" />
    <rect x="5.5" y="12" width="3" height="6" rx=".6" />
    <rect x="10.5" y="8" width="3" height="10" rx=".6" />
    <rect x="15.5" y="4" width="3" height="14" rx=".6" />
  </>,
  cdn: <>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16M12 4c2.5 2.2 3.5 5 3.5 8s-1 5.8-3.5 8c-2.5-2.2-3.5-5-3.5-8s1-5.8 3.5-8z" />
  </>,
  micro: <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
  </>,
  saas: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M6.5 14.5h4" /></>,
  cache: <>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <path
      d="M8 2.5v2.5M12 2.5v2.5M16 2.5v2.5M8 19v2.5M12 19v2.5M16 19v2.5M2.5 9h2.5M2.5 15h2.5M19 9h2.5M19 15h2.5"
    />
    <path d="M13 8.5 10 12.5h4L11 16" />
  </>,
  worker: <>
    <circle cx="12" cy="12" r="3" />
    <path
      d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"
    />
  </>,
  balancer: <>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4M12 11l-6 5M12 11l6 5M12 11v5" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="12" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </>,
  gpu: <>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="9" cy="12" r="3" />
    <path d="M9 9v6M6 12h6M15 9h3M15 12h3M15 15h3M6 18v2M10 18v2M14 18v2" />
  </>,
  lambda: <><path d="M7 4h3l7 16" /><path d="M12.5 10 7 20" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5.5 5.5M8 10.5h5M10.5 8v5" /></>,
  backup: <>
    <ellipse cx="12" cy="6" rx="6.5" ry="2.5" />
    <path d="M5.5 6v6c0 1.4 2.9 2.5 6.5 2.5M18.5 6v4" />
    <path d="M16 13.5a3.5 3.5 0 1 0 3.3 4.6M19.5 13v2.6H17" />
  </>,
  dns: <><path d="M12 3v18M12 5h7l2 2.5-2 2.5h-7M12 12H5l-2 2.5L5 17h7" /></>,
  firewall: <>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path
      d="M3.5 9.7h17M3.5 14.3h17M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"
    />
  </>,
  adserver: <><path d="M4 10v4h3l7 4V6l-7 4H4z" /><path d="M17.5 9.5a3.5 3.5 0 0 1 0 5M7 14l1.5 5h2" /></>,
  marketplace: <>
    <path d="M4 9.5 5.5 4h13L20 9.5" />
    <path
      d="M4 9.5c0 1.4 1.3 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.2 2.5 2.6 2.5S20 10.9 20 9.5"
    />
    <path d="M5.5 12v8h13v-8M10 20v-4.5h4V20" />
  </>,
  queue: <>
    <rect x="3" y="5" width="4" height="4" rx=".8" />
    <rect x="9" y="5" width="4" height="4" rx=".8" />
    <rect x="15" y="5" width="4" height="4" rx=".8" />
    <path d="M5 13v3a3 3 0 0 0 3 3h11M16 16l3 3-3 3" />
  </>,
  monitoring: <>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M6 11h3l2-4 2.5 7 2-3H18M9 21h6M12 17v4" />
  </>,
};

export function ModuleIcon({ id, size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {MODULE_ICONS[id]}
    </svg>
  );
}
