import React from 'react';
import PropTypes from 'prop-types';
import Status from '../Status';

import './index.scss';

const baseClass = 'sticky-header';

const StickyHeader = (props) => {
  const { showStatus, content, action } = props;

  return (
    <div className={baseClass}>
      {showStatus
        && <Status />
      }
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__content`}>
          {content}
        </div>
        <div className={`${baseClass}__controls`}>
          {action}
        </div>
      </div>
    </div>
  );
};

StickyHeader.defaultProps = {
  showStatus: true,
};

StickyHeader.propTypes = {
  content: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  showStatus: PropTypes.bool,
  action: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default StickyHeader;
