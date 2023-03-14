import React from 'react';
import Thumbnail from '../../../../../../elements/Thumbnail';
import { Props } from './types';

import './index.scss';

const baseClass = 'upload-cell';

const UploadCell:React.FC<Props> = ({ rowData, cellData, collection }: Props) => {
  return (
    <div className={baseClass}>
      <Thumbnail
        size="small"
        doc={{ ...rowData, filename: cellData }}
        collection={collection}
      />
      <span className={`${baseClass}__filename`}>{ String(cellData) }</span>
    </div>
  );
};

export default UploadCell;
