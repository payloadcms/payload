import * as React from 'react';
import { useDelay } from '../../../hooks/useDelay';

import './index.scss';

type ShimmerEffectT = {
  animationDelay?: string;
  height?: number | string;
  width?: number | string;
}
export const ShimmerEffect: React.FC<ShimmerEffectT> = ({ animationDelay = '0ms', height = '60px', width = '100%' }) => {
  return (
    <div
      className="shimmer-effect"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
      }}
    >
      <div
        className="shimmer-effect__shine"
        style={{
          animationDelay,
        }}
      />
    </div>
  );
};

type StaggeredShimmersT = {
  count: number;
  shimmerDelay?: number | string;
  height?: number | string;
  width?: number | string;
  className?: string;
  shimmerItemClassName?: string;
  renderDelay?: number;
}
export const StaggeredShimmers: React.FC<StaggeredShimmersT> = ({ count, className, shimmerItemClassName, width, height, shimmerDelay = 25, renderDelay = 500 }) => {
  const shimmerDelayToPass = typeof shimmerDelay === 'number' ? `${shimmerDelay}ms` : shimmerDelay;
  const [hasDelayed] = useDelay(renderDelay, true);

  if (!hasDelayed) return null;

  return (
    <div
      className={className}
    >
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={shimmerItemClassName}
        >
          <ShimmerEffect
            animationDelay={`calc(${i} * ${shimmerDelayToPass})`}
            height={height}
            width={width}
          />
        </div>
      ))}
    </div>
  );
};
