import { useTheme } from '@payloadcms/ui'

export const TextColorIcon: React.FC<{
  color?: { dark: string; light: string; type: 'background' | 'text' }
}> = ({ color }) => {
  const { theme } = useTheme()

  return (
    <svg
      className="icon"
      fill={color?.type !== 'text' ? 'currentColor' : color[theme === 'dark' ? 'light' : 'dark']}
      height="100%"
      style={{
        backgroundColor: color?.type !== 'background' ? 'transparent' : color[theme],
        borderRadius: '4px',
        color: 'var(--theme-elevation-900)',
      }}
      viewBox="0 0 24 24"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        dominantBaseline="middle"
        dy="0.1em"
        fontFamily="Arial"
        fontSize="20"
        fontWeight="normal"
        textAnchor="middle"
        x="50%"
        y="50%"
      >
        A
      </text>
    </svg>
  )
}
