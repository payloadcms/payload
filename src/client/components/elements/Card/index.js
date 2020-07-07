import React from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';

import './index.scss';

const baseClass = 'card';

const Card = (props) => {
  const { title, actions, onClick } = props;

  const classes = [
    baseClass,
    onClick && `${baseClass}--has-onclick`,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <h5>
        {title}
      </h5>
      {actions && (
        <div className={`${baseClass}__actions`}>
          {actions}
        </div>
      )}
      {onClick && (
        <Button
          className={`${baseClass}__click`}
          buttonStyle="none"
          onClick={onClick}
        />
      )}
    </div>
  );
};

Card.defaultProps = {
  actions: null,
  onClick: undefined,
};

Card.propTypes = {
  title: PropTypes.string.isRequired,
  actions: PropTypes.node,
  onClick: PropTypes.func,
};

export default Card;
