import React from 'react';

import './index.scss';

const baseClass = 'rich-text-button';

const ButtonElement: React.FC = ({ attributes, children, element }) => {
  const { style = 'primary', label } = element;

  return (
    <div
      className={baseClass}
      contentEditable={false}
    >
      <span
        {...attributes}
        className={[
          `${baseClass}__button`,
          `${baseClass}__button--${style}`,
        ].join(' ')}
      >
        {label}
        {children}
      </span>
    </div>
  );
};

export default ButtonElement;
