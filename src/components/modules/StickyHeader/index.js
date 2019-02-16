import React from 'react';
import { Sticky, Status } from 'payload/components';

import './index.scss';

const StickyHeader = props => {
  return (
    <Sticky className="sticky-header">
      {props.showStatus &&
        <Status />
      }
      <div className="sticky-header-wrap">
        <div className="content">
          {props.content}
        </div>
        <div className="controls">
          {props.action}
        </div>
      </div>
    </Sticky>
  )
}

export default StickyHeader;
