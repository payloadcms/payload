import React from 'react';
import PropTypes from 'prop-types';
import Sticky from '../../layout/Sticky';
import Status from '../Status';

import './index.scss';

const StickyHeader = (props) => {
  const { showStatus, content, action } = props;

  return (
    <Sticky className="sticky-header">
      {showStatus
        && <Status />
      }
      <div className="sticky-header-wrap">
        <div className="content">
          {content}
        </div>
        <div className="controls">
          {action}
        </div>
      </div>
    </Sticky>
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
