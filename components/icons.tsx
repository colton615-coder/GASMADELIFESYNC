import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const commonProps: IconProps = {
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const HomeIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);

export const TasksIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
);

export const CalendarDaysIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
);

export const RepeatIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
);

export const ShoppingCartIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
);

export const DumbbellIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M14.4 14.4 9.6 9.6M9.6 14.4 14.4 9.6M21 12c0-2.2-1.8-4-4-4h-2.2l-2.8-2.8a2.8 2.8 0 0 0-4 0L5.2 8H3c-2.2 0-4 1.8-4 4s1.8 4 4 4h2.2l2.8 2.8a2.8 2.8 0 0 0 4 0l2.8-2.8H17c2.2 0 4-1.8 4-4Z"/></svg>
);

export const GolfIcon: React.FC<IconProps> = (props) => (
    <svg {...commonProps} {...props}><path d="M18 18h-8a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v0"/><circle cx="18" cy="18" r="2"/></svg>
);

export const BookOpenIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
);

export const StatsIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

export const SettingsIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M2 14h4"/><path d="M10 8h4"/><path d="M18 16h4"/></svg>
);

export const ShieldIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

export const SunIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>
);

export const CloudIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
);

export const ZapIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);

export const CloudRainIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>
);

export const BoltIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);

export const PlusCircleIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
);

export const UploadIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);

export const MessageSquareIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);

export const BrainCircuitIcon: React.FC<IconProps> = (props) => (
    <svg {...commonProps} {...props}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5V5h-1a2.5 2.5 0 0 0-2.5 2.5V9" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5V5h1a2.5 2.5 0 0 1 2.5 2.5V9" />
      <path d="M5 14A2.5 2.5 0 0 1 2.5 12H2v-1a2.5 2.5 0 0 1 2.5-2.5H6" />
      <path d="M19 14a2.5 2.5 0 0 0 2.5-2.5H22v-1a2.5 2.5 0 0 0-2.5-2.5H18" />
      <path d="M9 15v1.5A2.5 2.5 0 0 0 11.5 19H12v1a2.5 2.5 0 0 0 2.5 2.5h0A2.5 2.5 0 0 0 17 20v-1h-1a2.5 2.5 0 0 1-2.5-2.5V15" />
      <path d="M9 9a2.5 2.5 0 0 0-2.5 2.5V13h1a2.5 2.5 0 0 1 2.5 2.5V15" />
      <path d="M15 9a2.5 2.5 0 0 1 2.5 2.5V13h-1a2.5 2.5 0 0 0-2.5 2.5V15" />
    </svg>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><polyline points="20 6 9 17 4 12" /></svg>
);

export const SmileIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

export const MinusIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

export const PencilIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);

export const XIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><polyline points="15 18 9 12 15 6" /></svg>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><polyline points="9 18 15 12 9 6" /></svg>
);

export const CalendarIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M10 3L8 8l-5 2 5 2 2 5 2-5 5-2-5-2-2-5z"/><path d="M18 13l-2 4-4-2 4-2-2-4 2 4 4 2z"/></svg>
);

export const AlertTriangleIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);

export const ImageIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

export const ArchiveIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
);

export const HeartIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);

export const QuoteIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-1-2-1 0-4 1-4 6v2"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.75-2-1-2-1 0-4 1-4 6v2"/></svg>
);

export const DatabaseIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

export const TrendingUpIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
);

export const RefreshCwIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const LoaderIcon: React.FC<IconProps> = (props) => (
    <svg {...commonProps} {...props} className={`animate-spin ${props.className || ''}`}>
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><polyline points="18 15 12 9 6 15" /></svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><polyline points="6 9 12 15 18 9" /></svg>
);

export const FileTextIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const TimerIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const ClipboardCheckIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><polygon points="5 3 19 12 5 21 5 3" /></svg>
);

export const PauseIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
);

export const RotateCcwIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
);

export const TagIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}>
    <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2z"/>
    <path d="M7 7h.01"/>
  </svg>
);

export const BarChartIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}>
    <line x1="12" x2="12" y1="20" y2="10" />
    <line x1="18" x2="18" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="16" />
  </svg>
);

export const FlameIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

export const SkipForwardIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}>
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

export const DeleteIcon: React.FC<IconProps> = (props) => (
  <svg {...commonProps} {...props}><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
);

export const GripVerticalIcon: React.FC<IconProps> = (props) => (
    <svg {...commonProps} {...props}>
        <circle cx="9" cy="12" r="1" />
        <circle cx="9" cy="5" r="1" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="15" cy="12" r="1" />
        <circle cx="15" cy="5" r="1" />
        <circle cx="15" cy="19" r="1" />
    </svg>
);