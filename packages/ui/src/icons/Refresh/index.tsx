import React from 'react'

import './index.css'

const paths = {
  16: {
    fill: 'M8 3.5a4.5 4.5 0 0 0-4.473 4c-.03.275-.25.5-.527.5a.467.467 0 0 1-.478-.5 5.5 5.5 0 0 1 9.758-2.954.467.467 0 0 1-.12.68c-.23.154-.538.09-.715-.122A4.49 4.49 0 0 0 8 3.5m-4.16 7.274a.467.467 0 0 0-.12.68A5.5 5.5 0 0 0 13.478 8.5.467.467 0 0 0 13 8c-.276 0-.497.225-.527.5a4.5 4.5 0 0 1-7.918 2.396c-.177-.212-.486-.276-.715-.123',
    stroke: 'M12.5 3v2.5H10m-4 5H3.5V13',
  },
  24: {
    fill: 'M17.523 12.036a.5.5 0 0 1 .449.546A5.999 5.999 0 0 1 7 15.315V17.5a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1H8.002q.066.089.137.175a5 5 0 0 0 8.838-2.69.5.5 0 0 1 .546-.45M17.5 6a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1h1.498a5 5 0 0 0-8.975 2.515.5.5 0 1 1-.995-.097A6 6 0 0 1 17 8.684V6.5a.5.5 0 0 1 .5-.5',
  },
}

export const RefreshIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 16 }) => (
  <svg
    className={['icon', 'icon--refresh', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    {size === 16 && paths[16].stroke && (
      <path
        d={paths[16].stroke}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
    <path clipRule="evenodd" d={paths[size].fill} fill="currentColor" fillRule="evenodd" />
  </svg>
)
