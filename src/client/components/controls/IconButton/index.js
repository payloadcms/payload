import React from 'react';
import PropTypes from 'prop-types';

import Button from '../Button';
import Crosshair from '../../graphics/Crosshair';
import Arrow from '../../graphics/Arrow';

import './index.scss';

const baseClass = 'icon-button';

const IconButton = React.forwardRef(({ iconName, className, ...rest }, ref) => {
  const classes = [
    baseClass,
    className && className,
    `${baseClass}--${iconName}`,
  ].filter(Boolean).join(' ');

  const icons = {
    crosshair: Crosshair,
    crossOut: Crosshair,
    arrow: Arrow,
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
  iconName: PropTypes.oneOf(['arrow', 'crossOut', 'crosshair']).isRequired,
  className: PropTypes.string,
};

export default IconButton;
