import React from 'react';
import Thumbnail from '../../../../../../elements/Thumbnail';

import './index.scss';

const baseClass = 'file';

const File = ({ rowData, data, collection }) => {
  return (
    <div className={baseClass}>
      <Thumbnail
        size="small"
        className={`${baseClass}__thumbnail`}
        doc={{
          ...rowData,
          filename: data,
        }}
        collection={collection}
      />
      <span className={`${baseClass}__filename`}>{ String(data) }</span>
    </div>
  );
};

export default File;
