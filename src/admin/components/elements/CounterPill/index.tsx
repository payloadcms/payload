import React from 'react';
import { Props } from './types';

import './index.scss';

const baseClass = 'counter-pill';

const CounterPill: React.FC<Props> = (props) => {
  const { className, pillStyle, number } = props;
  const lessThan3Chars = number < 99;

  const classes = [
    baseClass,
    `${baseClass}--style-${pillStyle}`,
    lessThan3Chars && `${baseClass}--fixed-width`,
    className && className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className={lessThan3Chars && `${baseClass}--float-number`}>
        {number}
      </div>
    </div>
  );
};

export default CounterPill;
