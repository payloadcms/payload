import type { CSSProperties } from 'react'

export const TextStyleIcon: React.FC<{
  css?: CSSProperties
}> = ({ css }) => {
  return (
    <span
      style={{
        ...css,
        alignItems: 'center',
        borderRadius: '4px',
        display: 'flex',
        fontSize: '18px',
        height: '20px',
        justifyContent: 'center',
        width: '20px',
      }}
    >
      A
    </span>
  )
}
