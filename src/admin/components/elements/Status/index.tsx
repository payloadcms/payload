import React from 'react';
import { Props } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';

import './index.scss';

const baseClass = 'status';

const Status: React.FC<Props> = () => {
  const { publishedDoc, unpublishedVersions } = useDocumentInfo();

  let statusToRender;

  if (unpublishedVersions?.docs?.length > 0 && publishedDoc) {
    statusToRender = 'Changed';
  } else if (!publishedDoc) {
    statusToRender = 'Draft';
  } else if (publishedDoc && unpublishedVersions?.docs?.length === 0) {
    statusToRender = 'Published';
  }

  if (statusToRender) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__value`}>
          {statusToRender}
        </div>
      </div>
    );
  }

  return null;
};

export default Status;
