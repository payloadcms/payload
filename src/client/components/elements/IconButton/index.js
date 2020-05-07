import React from 'react';
import PropTypes from 'prop-types';

import Button from '../Button';
import Plus from '../../icons/Plus';
import X from '../../icons/X';
import Chevron from '../../icons/Chevron';

import './index.scss';

const baseClass = 'icon-button';

const IconButton = React.forwardRef(({ iconName, className, ...rest }, ref) => {
  const classes = [
    baseClass,
    className && className,
    `${baseClass}--${iconName}`,
  ].filter(Boolean).join(' ');

  const icons = {
    Plus,
    X,
    Chevron,
  };

  const Icon = icons[iconName] || icons.arrow;

  return (
    <span ref={ref}>
      <Button
        className={classes}
        {...rest}
      >
        <Icon />
      </Button>
    </span>
  );
});

IconButton.defaultProps = {
  className: '',
};

IconButton.propTypes = {
  iconName: PropTypes.oneOf(['Chevron', 'X', 'Plus']).isRequired,
  className: PropTypes.string,
};

export default IconButton;
