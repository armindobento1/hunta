// Technical-drawing weapon silhouettes for the blueprint loadout builder.
// Drawn to line up with the slot anchors in lib/domain/armory.ts
// (rifle: optic 44/18, muzzle 93/42, ammo 36/58, bipod 70/82, sling 16/72;
//  bow: sight 42/38, arrow 62/50, broadhead 88/50, sling 30/80).

export function RifleSilhouette() {
  return (
    <svg viewBox="0 0 400 120" preserveAspectRatio="none" role="img" aria-label="Rifle — side profile">
      <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round">
        {/* scope */}
        <rect x="146" y="14" width="60" height="15" rx="7" />
        <rect x="206" y="11" width="15" height="21" rx="5" />
        <rect x="134" y="17" width="12" height="9" rx="3" />
        <path d="M160 29 L160 44 M194 29 L194 44" />
        {/* stock */}
        <path d="M10 58 C4 62 2 76 9 90 L52 92 C70 92 84 82 98 74" />
        <path d="M10 58 L58 54 L118 48" />
        {/* receiver */}
        <path d="M118 48 L236 46 L236 66 L98 74 Z" />
        {/* barrel to muzzle (93%) */}
        <path d="M236 48 L364 44 L372 45 L372 55 L364 54 L236 62" />
        {/* magazine (36%) */}
        <path d="M134 70 L162 69 L158 92 L140 93 Z" />
        {/* trigger guard */}
        <path d="M176 68 C172 82 184 86 192 82 C196 78 194 70 192 68" />
        {/* bolt */}
        <path d="M214 50 L226 58 L232 58" />
      </g>
    </svg>
  );
}

export function BowSilhouette() {
  return (
    <svg viewBox="0 0 200 264" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Compound bow — side profile">
      <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round">
        {/* upper limb + cam */}
        <path d="M84 96 L64 28 M92 94 L72 24" />
        <circle cx="66" cy="20" r="11" />
        <circle cx="66" cy="20" r="2.4" />
        {/* riser */}
        <path d="M84 96 C70 122 100 142 84 168 C76 182 84 194 84 208 M92 94 C80 122 108 144 92 170 C86 182 92 196 92 206" />
        {/* grip */}
        <path d="M82 148 L82 168" strokeWidth="3" />
        {/* lower limb + cam */}
        <path d="M84 208 L66 240 M92 206 L74 244" />
        <circle cx="68" cy="248" r="11" />
        <circle cx="68" cy="248" r="2.4" />
        {/* string + cable */}
        <path d="M58 26 L60 244" />
        <path d="M70 30 L66 132 L70 240" strokeWidth="1" opacity="0.7" />
        {/* stabilizer */}
        <path d="M80 158 L30 168" />
        <circle cx="26" cy="169" r="4" />
        {/* nocked arrow toward broadhead anchor (88%) */}
        <path d="M64 132 L168 132" />
        <path d="M168 128 L180 132 L168 136 Z" />
        <path d="M74 128 L82 132 L74 136 M84 128 L92 132 L84 136" strokeWidth="1" />
      </g>
    </svg>
  );
}
