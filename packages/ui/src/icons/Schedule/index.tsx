import React from 'react'

const paths = {
  active: {
    clock:
      'M12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5ZM12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6ZM12 8C12.2761 8 12.5 8.22386 12.5 8.5V11.793L14.3535 13.6465C14.5488 13.8417 14.5488 14.1583 14.3535 14.3535C14.1583 14.5488 13.8417 14.5488 13.6465 14.3535L11.6465 12.3535C11.5527 12.2597 11.5 12.1326 11.5 12V8.5C11.5 8.22386 11.7239 8 12 8Z',
    mask: 'M24 24H0V0H24V24ZM18 3.5C16.067 3.5 14.5 5.067 14.5 7C14.5 8.933 16.067 10.5 18 10.5C19.933 10.5 21.5 8.933 21.5 7C21.5 5.067 19.933 3.5 18 3.5Z',
  },
  inactive: {
    clock:
      'M12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5ZM12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6ZM12 8C12.2761 8 12.5 8.22386 12.5 8.5V11.793L14.3535 13.6465C14.5488 13.8417 14.5488 14.1583 14.3535 14.3535C14.1583 14.5488 13.8417 14.5488 13.6465 14.3535L11.6465 12.3535C11.5527 12.2597 11.5 12.1326 11.5 12V8.5C11.5 8.22386 11.7239 8 12 8Z',
  },
}

export const ScheduleIcon: React.FC<{
  readonly active?: boolean
  readonly className?: string
  readonly size?: 24
}> = ({ active = false, className, size = 24 }) => {
  const variant = active ? paths.active : paths.inactive

  return (
    <svg
      className={['icon', 'icon--schedule', className].filter(Boolean).join(' ')}
      fill="none"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="18" cy="7" fill="var(--color-icon-danger)" r="2" />
      <mask
        height={size}
        id="schedule-mask"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'alpha' as const }}
        width={size}
        x="0"
        y="0"
      >
        <path d={paths.active.mask} fill="currentColor" />
      </mask>
      <g mask="url(#schedule-mask)">
        <path clipRule="evenodd" d={variant.clock} fill="currentColor" fillRule="evenodd" />
      </g>
    </svg>
  )
}
