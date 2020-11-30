import React from 'react';
import { useNegativeFieldGutter } from './context';
import { Props } from './types';

import './index.scss';

const baseClass = 'field-type-gutter';

const FieldTypeGutter: React.FC<Props> = ({
  children,
  variant = 'left',
  verticalAlignment = 'sticky',
  className,
  dragHandleProps = {},
}) => {
  const allowNegativeGutter = useNegativeFieldGutter();

  const classes = [
    baseClass,
    `${baseClass}--${variant}`,
    `${baseClass}--v-align-${verticalAlignment}`,
    allowNegativeGutter && `${baseClass}--negative-gutter`,
    className && className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      {...dragHandleProps}
    >
      <div className={`${baseClass}__content-container`}>
        <div className={`${baseClass}__content`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default FieldTypeGutter;
