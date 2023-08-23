import React from 'react';

import './index.scss';

const DragHandle: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={[
      'icon icon--more',
      className,
    ].filter(Boolean).join(' ')}
    viewBox="0 0 25 25"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="16.3872"
      cy="12.5"
      r="1"
      className="fill"
    />
    <circle
      cx="12.3872"
      cy="12.5"
      r="1"
      className="fill"
    />
    <circle
      cx="8.61279"
      cy="12.5"
      r="1"
      className="fill"
    />
  </svg>
);

export default DragHandle;
