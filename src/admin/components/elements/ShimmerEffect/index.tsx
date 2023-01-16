import * as React from 'react';

import './index.scss';

export const ShimmerEffect: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="shimmer-effect">
      {children}
      <div className="shimmer-effect__shimmer" />
    </div>
  );
};
