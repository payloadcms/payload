import React from 'react'

import './index.css'

const paths = {
  16: 'M11.5 3a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-.034l-.071 1H12a.5.5 0 0 1 0 1h-.677l-.29 4.071a1 1 0 0 1-.999.929H5.966a1 1 0 0 1-.998-.929L4.677 8H4a.5.5 0 0 1 0-1h.605l-.07-1H4.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm-5.534 9h4.068l.429-6H5.537zm2.68-4.354a.5.5 0 1 1 .708.708L8.707 9l.647.646a.5.5 0 1 1-.708.707L8 9.708l-.646.646a.5.5 0 1 1-.708-.707L7.293 9l-.647-.646a.5.5 0 1 1 .708-.708L8 8.293zM4.5 5h7V4h-7z',
  24: 'M16.5 6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-.04l-.08 1H17a.5.5 0 0 1 0 1h-.7l-.454 5.621A1.5 1.5 0 0 1 14.35 18H9.649a1.5 1.5 0 0 1-1.495-1.379L7.7 11H7a.5.5 0 0 1 0-1h.62l-.08-1H7.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM9.151 16.54a.5.5 0 0 0 .498.46h4.702a.5.5 0 0 0 .498-.46L15.458 9H8.542zm3.496-4.893a.5.5 0 1 1 .707.707l-.647.646.646.646a.5.5 0 1 1-.707.707L12 13.708l-.646.646a.5.5 0 1 1-.707-.707l.646-.646-.646-.646a.5.5 0 1 1 .707-.707l.646.646zM7.5 8h9V7h-9z',
  // Legacy compact variant for backwards compatibility (24x24 viewBox with smaller visual weight)
  small:
    'M6.5 7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-.039l-.08 1H17a.5.5 0 0 1 0 1h-.7l-.455 5.62A1.5 1.5 0 0 1 14.35 18h-4.7a1.5 1.5 0 0 1-1.495-1.38L7.7 11H7a.5.5 0 0 1 0-1h.62l-.081-1H7.5a1 1 0 0 1-1-1zm9.494 1h.506V7h-9v1zm-.536 1H8.542l.61 7.54a.5.5 0 0 0 .498.46h4.7a.5.5 0 0 0 .499-.46zM11.5 11.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0z',
}

export function TrashIcon({
  className,
  size = 24,
  small,
}: {
  readonly className?: string
  readonly size?: 16 | 24
  /**
   * @deprecated Use `size={16}` instead. This renders a compact 24x24 variant for legacy compatibility.
   */
  readonly small?: boolean
}) {
  const viewBoxSize = small ? 24 : size
  const pathKey = small ? 'small' : size

  return (
    <svg
      className={['icon', 'icon--trash', className].filter(Boolean).join(' ')}
      fill="none"
      height={viewBoxSize}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={viewBoxSize}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={paths[pathKey]} fill="currentColor" />
    </svg>
  )
}
