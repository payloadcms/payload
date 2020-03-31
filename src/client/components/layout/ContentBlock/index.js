import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'content-block';

const ContentBlock = (props) => {
  const {
    className, width, align, style, children,
  } = props;

  const classes = [
    className,
    baseClass,
    width && `${baseClass}--width-${width}`,
    align && `${baseClass}--align-${align}`,
  ].filter(Boolean).join(' ');

  return (
    <section
      className={classes}
      style={style}
    >
      {children}
    </section>
  );
};

ContentBlock.defaultProps = {
  align: null,
  width: null,
  className: null,
  style: {},
};

ContentBlock.propTypes = {
  width: PropTypes.oneOf(['narrow', 'wide']),
  align: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
  style: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
};

export default ContentBlock;
