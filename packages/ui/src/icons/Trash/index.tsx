import React from 'react'

import './index.css'

export function TrashIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={['icon', 'icon--trash', className].filter(Boolean).join(' ')}
      fill="none"
      height={24}
      viewBox="0 0 24 24"
      width={24}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M6 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .496.5h12.008a.5.5 0 0 0 .496-.5v-1A.5.5 0 0 0 18 5zM4.5 6.5a1.5 1.5 0 0 0 1.037 1.427L5.725 10H5a.5.5 0 0 0 0 1h.816l.653 7.181A2 2 0 0 0 8.46 20h7.078a2 2 0 0 0 1.992-1.819L18.184 11H19a.5.5 0 0 0 0-1h-.725l.188-2.073A1.5 1.5 0 0 0 19.5 6.5v-1A1.5 1.5 0 0 0 18 4H6a1.5 1.5 0 0 0-1.5 1.5zm2.965 11.59L6.548 8h10.905l-.918 10.09a1 1 0 0 1-.996.91H8.461a1 1 0 0 1-.996-.91M11 10.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0zm3 0a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  )
}
