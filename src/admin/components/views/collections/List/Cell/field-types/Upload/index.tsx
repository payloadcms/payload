import React from 'react';

const UploadCell = ({ data }) => (
  <React.Fragment>
    <span>
      {data?.filename}
    </span>
  </React.Fragment>
);

export default UploadCell;
