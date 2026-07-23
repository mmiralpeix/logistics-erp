import React from 'react';

// Inspired by specialized fleet machinery (Randon Semi Cisterna, Carretones, Tractores 6x4)

export function IconSemiCisterna({ className = 'w-5 h-5', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Tank body (rounded cylinder with domed ends) */}
      <path d="M 4,5 H 17 C 19.5,5 21,7 21,9.5 C 21,12 19.5,14 17,14 H 4 C 1.5,14 1,12 1,9.5 C 1,7 1.5,5 4,5 Z" />
      {/* Catwalk & ladder top ribs */}
      <line x1="6" y1="5" x2="6" y2="3" />
      <line x1="12" y1="5" x2="12" y2="3" />
      <line x1="5" y1="3" x2="13" y2="3" />
      {/* Diamond UN hazard placard (Rombo Naranja Cargas Peligrosas) */}
      <polygon points="9.5,9.5 11,8 12.5,9.5 11,11" fill="currentColor" fillOpacity="0.25" strokeWidth="1.25" />
      {/* Landing legs (patas de apoyo delanteras) */}
      <path d="M 5,14 V 18 H 3 M 5,18 H 7" />
      {/* Dual rear wheels (ejes traseros en tándem) */}
      <circle cx="13.5" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      {/* Underchassis beam */}
      <line x1="5" y1="14" x2="18" y2="14" />
    </svg>
  );
}

export function IconCarreton({ className = 'w-5 h-5', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Gooseneck step down to lowbed heavy deck */}
      <path d="M 1,9 H 5 L 8,14 H 22 V 16 H 1 Z" />
      {/* Rear loading ramps */}
      <line x1="22" y1="14" x2="23.5" y2="10" />
      {/* 3 Heavy axles / wheels */}
      <circle cx="11" cy="18" r="2" />
      <circle cx="15" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
    </svg>
  );
}

export function IconTractor({ className = 'w-5 h-5', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Heavy truck cab */}
      <path d="M 3,17 V 7 C 3,5.5 4.5,4 6,4 H 11 C 12.5,4 13.5,5 14,6.5 L 15,10 H 21 V 17 H 3 Z" />
      {/* Windshield */}
      <path d="M 8,7 H 12 L 13,10 H 8 Z" />
      {/* Fifth wheel coupling plate (plato de enganche) */}
      <path d="M 16,14 H 20 M 18,14 V 12" />
      {/* Wheels 6x4 */}
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="15" cy="18" r="2.5" />
      <circle cx="19.5" cy="18" r="2.5" />
    </svg>
  );
}

export function IconSemiSider({ className = 'w-5 h-5', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Sider curtain trailer box */}
      <rect x="2" y="5" width="19" height="10" rx="1" />
      {/* Curtain straps */}
      <line x1="8" y1="5" x2="8" y2="15" />
      <line x1="14" y1="5" x2="14" y2="15" />
      {/* Landing legs */}
      <path d="M 5,15 V 18 H 7" />
      {/* Dual rear wheels */}
      <circle cx="14" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function IconBatea({ className = 'w-5 h-5', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Slanted dump bed */}
      <path d="M 2,7 L 4,14 H 21 L 22,7 Z" />
      {/* Landing legs */}
      <line x1="5" y1="14" x2="5" y2="18" />
      {/* Dual rear wheels */}
      <circle cx="14" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function getFleetIcon(tipo: string, className = 'w-4 h-4') {
  switch (tipo) {
    case 'SEMI_CISTERNA':
    case 'CISTERNA':
      return <IconSemiCisterna className={className} />;
    case 'CARRETON':
      return <IconCarreton className={className} />;
    case 'TRACTOR':
      return <IconTractor className={className} />;
    case 'SEMIRREMOLQUE':
      return <IconSemiSider className={className} />;
    case 'BATEA':
    case 'VOLQUETE':
      return <IconBatea className={className} />;
    default:
      return <IconTractor className={className} />;
  }
}
