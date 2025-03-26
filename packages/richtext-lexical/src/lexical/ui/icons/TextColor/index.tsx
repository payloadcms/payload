export const TextColorIcon: React.FC<{ color?: string; type: 'background' | 'none' | 'text' }> = ({
  type,
  color,
}) => (
  <svg
    className="icon"
    fill="none"
    height="100%"
    stroke={type !== 'text' ? 'currentColor' : color}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    style={{
      backgroundColor: type !== 'text' ? color : 'transparent',
      borderRadius: '4px',
    }}
    viewBox="0 0 24 24"
    width="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 20h16" />
    <path d="m6 16 6-12 6 12" />
    <path d="M8 12h8" />
  </svg>
)
