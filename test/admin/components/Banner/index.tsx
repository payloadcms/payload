export function Banner(props: {
  children?: React.ReactNode
  description?: string
  message?: string
}) {
  const { children, description, message } = props
  return (
    <div
      style={{
        backgroundColor: 'var(--theme-warning-100)',
        border: '1px dashed',
        color: 'var(--theme-warning-750)',
        padding: '1rem',
      }}
    >
      {children || message || description || 'A custom banner component'}
    </div>
  )
}
