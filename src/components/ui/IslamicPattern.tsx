'use client';

interface IslamicPatternProps {
  theme: string;
}

export function IslamicPattern({ theme }: IslamicPatternProps) {
  const patternColor = theme === 'tamkeen-dark'
    ? 'var(--tamkeen-dark-primary)'
    : 'var(--tamkeen-primary)';
  const patternOpacity = theme === 'tamkeen-dark' ? 0.11 : 0.17;

  /**
   * This path creates the "Girih" intersections.
   * Based on an 8-fold symmetry tile (tessellation).
   */
  const girihPath = "M0 31.25 L31.25 31.25 L31.25 0 M68.75 0 L68.75 31.25 L100 31.25 M100 68.75 L68.75 68.75 L68.75 100 M31.25 100 L31.25 68.75 L0 68.75 M50 0 L100 50 L50 100 L0 50 Z M31.25 31.25 L50 12.5 L68.75 31.25 L87.5 50 L68.75 68.75 L50 87.5 L31.25 68.75 L12.5 50 Z";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="islamic-girih"
            x="0"
            y="0"
            width="80" 
            height="80"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(0)"
          >
            {/* Using a viewBox of 100 100 for the path math, 
                but scaling it into the 80x80 tile */}
            <g 
              fill="none" 
              stroke={patternColor} 
              strokeOpacity={patternOpacity} 
              strokeWidth="1.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path 
                d={girihPath} 
                transform="scale(0.8)" 
              />
              {/* Secondary offset path to create the traditional "thick/thin" 
                  interwoven effect if desired, or just to fill the space */}
              <circle cx="40" cy="40" r="4" fill={patternColor} fillOpacity={patternOpacity * 0.5} stroke="none" />
            </g>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#islamic-girih)" />
      </svg>
      
      {/* Subtle vignette for a premium look */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.03)_100%)]" />
    </div>
  );
}