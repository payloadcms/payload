import { useTheme } from '@payloadcms/ui'

export const TextColorIcon: React.FC<{
  color?: { dark: string; light: string; type: 'background' | 'text' }
}> = ({ color }) => {
  const { theme } = useTheme()

  return (
    <svg
      className="icon"
      fill="none"
      height="100%"
      stroke={color?.type !== 'text' ? 'currentColor' : color[theme === 'dark' ? 'light' : 'dark']}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      style={{
        backgroundColor: color?.type !== 'background' ? 'transparent' : color[theme],
        borderRadius: '4px',
        color: 'var(--theme-elevation-900)',
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
}
