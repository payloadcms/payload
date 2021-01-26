import React from 'react';

import './index.scss';

const baseClass = 'upload-cell';

const UploadCell = ({ data }) => (
  <React.Fragment>
    <span>
      {data?.filename}
    </span>
    <span className={`${baseClass}--mime-type`}>
      {' '}
      {data?.mimeType}
    </span>
  </React.Fragment>
);

export default UploadCell;
