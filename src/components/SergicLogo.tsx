vainterface SergicLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export function SergicLogo({ size = 'md' }: SergicLogoProps) {
  const w = { sm: 90, md: 140, lg: 200 }[size]

  return (
    <svg
      width={w}
      height={Math.round(w * 40 / 160)}
      viewBox="0 0 160 40"
      xmlns="http://www.w3.org/2000/svg"
      style={{ userSelect: 'none', display: 'block' }}
    >
      <text
        x="0"
        y="30"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="34"
        fontWeight="900"
        fill="#1a3a6e"
        letterSpacing="1"
      >
        SERGIC
      </text>
      <rect x="0" y="36" width="155" height="4" fill="#e8610a" rx="1" />
    </svg>
  )
}
