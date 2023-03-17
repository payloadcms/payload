import React from 'react';
import { Link } from 'react-router-dom';
import Thumbnail from '../../../../../../elements/Thumbnail';
import type { Props } from './types';
import { useConfig } from '../../../../../../utilities/Config';

import './index.scss';

const baseClass = 'upload-cell';

const UploadCell:React.FC<Props> = ({ rowData, cellData, collection }: Props) => {
  const { routes: { admin } } = useConfig();

  return (
    <Link
      className={baseClass}
      to={`${admin}/collections/${collection.slug}/${rowData.id}`}
    >
      <Thumbnail
        size="small"
        doc={{
          ...rowData,
          filename: cellData,
        }}
        collection={collection}
      />
      <span className={`${baseClass}__filename`}>{ String(cellData) }</span>
    </Link>
  );
};

export default UploadCell;
