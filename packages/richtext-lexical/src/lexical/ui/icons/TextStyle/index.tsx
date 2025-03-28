import type { StyleObject } from '../../../../features/textStyles/feature.server.js'

function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

export const TextStyleIcon: React.FC<{
  css?: StyleObject
}> = ({ css }) => {
  const convertedCss = css
    ? Object.fromEntries(Object.entries(css).map(([key, value]) => [kebabToCamelCase(key), value]))
    : {}

  return (
    <span
      style={{
        ...convertedCss,
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
