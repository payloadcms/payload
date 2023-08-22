import React from 'react';
import Button from '../Button';
import { Props } from './types';

import './index.scss';

const baseClass = 'card';

const Card: React.FC<Props> = (props) => {
  const { id, title, titleAs, buttonAriaLabel, actions, onClick } = props;

  const classes = [
    baseClass,
    id,
    onClick && `${baseClass}--has-onclick`,
  ].filter(Boolean).join(' ');

  const Tag = titleAs ?? 'div';

  return (
    <div
      className={classes}
      id={id}
    >
      <Tag className={`${baseClass}__title`}>
        {title}
      </Tag>
      {actions && (
        <div className={`${baseClass}__actions`}>
          {actions}
        </div>
      )}
      {onClick && (
        <Button
          aria-label={buttonAriaLabel}
          className={`${baseClass}__click`}
          buttonStyle="none"
          onClick={onClick}
        />
      )}
    </div>
  );
};

export default Card;
