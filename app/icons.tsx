// Profesjonelle strek-ikoner (SVG, currentColor). Erstatter emoji for et voksent uttrykk.
import type { SVGProps } from "react";

type IkonProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ children, size = 22, ...p }: IkonProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const KalenderIkon = (p: IkonProps) => (
  <Base {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 3v3M16 3v3" />
  </Base>
);

export const KortIkon = (p: IkonProps) => (
  <Base {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 10h19M6.5 15h4" />
  </Base>
);

export const ChatIkon = (p: IkonProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="13" rx="3" />
    <path d="M8 17v3l3.2-3" />
    <path d="M8 9.5h8M8 12.5h5" />
  </Base>
);

export const SkjoldIkon = (p: IkonProps) => (
  <Base {...p}>
    <path d="M12 3l7 2.6v5.2c0 4.4-3 7.4-7 8.9-4-1.5-7-4.5-7-8.9V5.6L12 3z" />
    <path d="M9 12l2 2 4-4.2" />
  </Base>
);

export const ProsentIkon = (p: IkonProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 8.5l7 7" />
    <circle cx="9" cy="9" r="0.6" />
    <circle cx="15" cy="15" r="0.6" />
  </Base>
);

export const MerkelappIkon = (p: IkonProps) => (
  <Base {...p}>
    <path d="M4 4h7l9 9-7 7-9-9V4z" />
    <circle cx="8" cy="8" r="1.3" />
  </Base>
);

export const SjekkIkon = (p: IkonProps) => (
  <Base {...p}>
    <path d="M4 12.5l5 5L20 6.5" />
  </Base>
);

export const GnistIkon = (p: IkonProps) => (
  <Base {...p}>
    <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
  </Base>
);

// Håndverker-nisje
export const VerktoyIkon = (p: IkonProps) => (
  <Base {...p}>
    <path d="M14.7 6.3a3.8 3.8 0 0 0-5 4.9l-6 6L6 19.6l6-6a3.8 3.8 0 0 0 4.9-5l-2.4 2.4-2-2 2.2-2.7z" />
  </Base>
);

export const HjelmIkon = (p: IkonProps) => (
  <Base {...p}>
    <path d="M3 16h18" />
    <path d="M5 16v-1a7 7 0 0 1 14 0v1" />
    <path d="M10 5.5a5 5 0 0 1 4 0V8h-4V5.5z" />
  </Base>
);

export const HusIkon = (p: IkonProps) => (
  <Base {...p}>
    <path d="M4 11l8-6 8 6" />
    <path d="M6 10v9h12v-9" />
    <path d="M10 19v-5h4v5" />
  </Base>
);

export const KlokkeIkon = (p: IkonProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const KameraIkon = (p: IkonProps) => (
  <Base {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <circle cx="12" cy="13.5" r="3.4" />
    <path d="M8 7l1.4-2.3h5.2L16 7" />
  </Base>
);

export const StjerneIkon = (p: IkonProps) => (
  <Base {...p}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />
  </Base>
);

export const SokIkon = (p: IkonProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.3-4.3" />
  </Base>
);
