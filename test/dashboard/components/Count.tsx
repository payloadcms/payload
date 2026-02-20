/* eslint-disable no-restricted-exports */
import { type WidgetServerProps } from 'payload'

export default async function Count({ req, widgetData }: WidgetServerProps<'count'>) {
  let count = 0
  let error: null | string = null

  const selectedCollection =
    typeof widgetData?.collection === 'string' && widgetData.collection.length > 0
      ? widgetData.collection
      : 'tickets'
  const payload = req.payload
  const title =
    typeof widgetData?.title === 'string' && widgetData.title ? widgetData.title : 'Tickets'
  const color = 'blue'
  const icon = '📊'
  const changePercent = 10
  const changeText = '10% increase'

  try {
    const result = await payload.count({
      collection: selectedCollection,
    })
    count = result.totalDocs
  } catch (err) {
    error =
      err instanceof Error
        ? `${err.message} (${selectedCollection})`
        : `Failed to fetch count (${selectedCollection})`
    // eslint-disable-next-line no-console
    console.error(`Error fetching count for ${selectedCollection}:`, err)
  }

  const getColorStyles = (color: 'blue' | 'green' | 'orange' | 'purple' | 'red') => {
    const colors = {
      blue: { backgroundColor: '#eff6ff', color: '#2563eb' },
      green: { backgroundColor: '#ecfdf5', color: '#059669' },
      orange: { backgroundColor: '#fff7ed', color: '#ea580c' },
      purple: { backgroundColor: '#faf5ff', color: '#9333ea' },
      red: { backgroundColor: '#fef2f2', color: '#dc2626' },
    }
    return colors[color]
  }

  return (
    <div
      className="count-widget card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
      }}
    >
      {error ? (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            height: '100%',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '24px' }}>
            <span aria-label="Warning" role="img">
              ⚠️
            </span>
          </div>
          <h3 style={{ fontSize: '16px', margin: 0 }}>{title}</h3>
          <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, textAlign: 'center' }}>
            {error}
          </p>
        </div>
      ) : (
        <>
          <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
            <div
              style={{
                alignItems: 'center',
                borderRadius: '8px',
                display: 'flex',
                fontSize: '18px',
                height: '40px',
                justifyContent: 'center',
                width: '40px',
                ...getColorStyles(color),
              }}
            >
              <span aria-label={`${title} icon`} role="img">
                {icon}
              </span>
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{title}</h3>
          </div>

          <div>
            <span style={{ fontSize: '32px', fontWeight: 700 }}>{count.toLocaleString()}</span>
          </div>

          {changePercent !== undefined && changeText && (
            <div style={{ alignItems: 'center', display: 'flex', gap: '6px', marginTop: 'auto' }}>
              <span
                style={{
                  color: changePercent > 0 ? '#059669' : changePercent < 0 ? '#dc2626' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {changePercent > 0 ? '+' : ''}
                {changePercent}%
              </span>
              <span style={{ fontSize: '14px', opacity: 0.7 }}>{changeText}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
