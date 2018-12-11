import React from 'react';
import { Sticky } from 'payload/components';

import './index.scss';

const StickyAction = props => {
  return (
    <Sticky className="action">
      <div className="content">
        {props.content}
      </div>
      <div className="controls">
        {props.action}
      </div>
    </Sticky>
  )
}

export default StickyAction;
