export function Banner(props: { description?: string; message?: string }) {
  const { description, message } = props
  return (
    <div
      style={{
        backgroundColor: 'var(--theme-warning-100)',
        border: '1px dashed',
        color: 'var(--theme-warning-750)',
        padding: '1rem',
      }}
    >
      {message || description || 'A custom banner component'}
    </div>
  )
}
