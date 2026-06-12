'use client'
import React from 'react'

const paths = {
  // icon-24-trash - standard variant
  default:
    'M6 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .496.5h12.008a.5.5 0 0 0 .496-.5v-1A.5.5 0 0 0 18 5zM4.5 6.5a1.5 1.5 0 0 0 1.037 1.427L5.725 10H5a.5.5 0 0 0 0 1h.816l.653 7.181A2 2 0 0 0 8.46 20h7.078a2 2 0 0 0 1.992-1.819L18.184 11H19a.5.5 0 0 0 0-1h-.725l.188-2.073A1.5 1.5 0 0 0 19.5 6.5v-1A1.5 1.5 0 0 0 18 4H6a1.5 1.5 0 0 0-1.5 1.5zm2.965 11.59L6.548 8h10.905l-.918 10.09a1 1 0 0 1-.996.91H8.461a1 1 0 0 1-.996-.91M11 10.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0zm3 0a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z',
  // icon-24-trash-small - compact variant
  small:
    'M6.5 7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-.039l-.08 1H17a.5.5 0 0 1 0 1h-.7l-.455 5.62A1.5 1.5 0 0 1 14.35 18h-4.7a1.5 1.5 0 0 1-1.495-1.38L7.7 11H7a.5.5 0 0 1 0-1h.62l-.081-1H7.5a1 1 0 0 1-1-1zm9.494 1h.506V7h-9v1zm-.536 1H8.542l.61 7.54a.5.5 0 0 0 .498.46h4.7a.5.5 0 0 0 .499-.46zM11.5 11.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0z',
}

export const TrashIcon: React.FC<{
  readonly className?: string
  /**
   * Use the compact trash icon variant (icon-24-trash-small).
   * Both variants are 24x24, but the small variant has less visual weight.
   */
  readonly small?: boolean
}> = ({ className, small }) => (
  <svg
    aria-hidden="true"
    className={['icon', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d={small ? paths.small : paths.default}
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
