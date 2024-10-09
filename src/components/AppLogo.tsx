

interface AppLogoProps{
    className?: string;
  size?: number;
}


export default function AppLogo({
    className = "",
    size = 48
} : AppLogoProps) {

    const iconSize = size * 0.5;

  return (
    <span className={className}>
        <div className={`flex select-none items-center ${size <= 80 ? `h-[${size}px]` : `w-[${size}px] flex-col`} text-primary`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path
              strokeWidth="2"
              d="M14.8 7.5a1.84 1.84 0 0 0-2.6 0l-.2.3-.3-.3a1.84 1.84 0 1 0-2.4 2.8L12 13l2.7-2.7c.9-.9.8-2.1.1-2.8"
              fill="currentColor"
            />
          </svg>
          <span className={`text-[${size * 1.25}px] font-bold`}>OchoApp</span>
        </div>
    </span>
  );
}
