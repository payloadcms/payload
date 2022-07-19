import React, { forwardRef, Ref } from 'react';
import './index.scss';

type Props = {
  left?: boolean
  right?: boolean
  negativeLeft?: boolean
  negativeRight?: boolean
  className?: string
  children: React.ReactNode
  ref?: Ref<HTMLDivElement>
}

const baseClass = 'gutter';

export const Gutter: React.FC<Props> = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {
    left = true,
    right = true,
    negativeLeft = false,
    negativeRight = false,
    className,
    children,
  } = props;

  const shouldPadLeft = left && !negativeLeft;
  const shouldPadRight = right && !negativeRight;

  return (
    <div
      ref={ref}
      className={[
        shouldPadLeft && `${baseClass}--left`,
        shouldPadRight && `${baseClass}--right`,
        negativeLeft && `${baseClass}--negative-left`,
        negativeRight && `${baseClass}--negative-right`,
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
});


Gutter.displayName = 'Gutter';
