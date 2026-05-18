interface Props { size?: number; color?: string }
export default function Logo({ size = 26, color = '#00e676' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" stroke={color} strokeWidth="1.5" />
      <path d="M8 14.5L11.5 10.5L14 13L16.5 10.5L20 14.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M8 17.5L11.5 13.5L14 16L16.5 13.5L20 17.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4" />
    </svg>
  )
}
