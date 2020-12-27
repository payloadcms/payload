import React from 'react';
import { Props } from './types';

import './index.scss';

const baseClass = 'template-minimal';

const Minimal: React.FC<Props> = (props) => {
  const {
    className,
    style = {},
    children,
    width = 'normal',
  } = props;

  const classes = [
    className,
    baseClass,
    `${baseClass}--width-${width}`,
  ].filter(Boolean).join(' ');

  return (
    <section
      className={classes}
      style={style}
    >
      <div className={`${baseClass}__wrap`}>
        {children}
      </div>
    </section>
  );
};

export default Minimal;
