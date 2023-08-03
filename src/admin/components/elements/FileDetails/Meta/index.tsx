import React, { useState } from 'react';
import { useConfig } from '../../../utilities/Config';
import CopyToClipboard from '../../CopyToClipboard';
import formatFilesize from '../../../../../uploads/formatFilesize';
import { Props } from './types';
import { useDocumentDrawer } from '../../DocumentDrawer';
import Edit from '../../../icons/Edit';
import Tooltip from '../../Tooltip';

import './index.scss';

const baseClass = 'file-meta';

const Meta: React.FC<Props> = (props) => {
  const {
    filename, filesize, width, height, mimeType, staticURL, url, id, collection,
  } = props;

  const [hovered, setHovered] = useState(false);
  const openInDrawer = Boolean(id && collection);

  const [
    DocumentDrawer,
    DocumentDrawerToggler,
  ] = useDocumentDrawer({
    id, collectionSlug: collection,
  });

  const { serverURL } = useConfig();

  const fileURL = url || `${serverURL}${staticURL}/${filename}`;

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__url`}>
        {openInDrawer && <DocumentDrawer />}
        <a
          href={fileURL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {filename}
        </a>
        <CopyToClipboard
          value={fileURL}
          defaultMessage="Copy URL"
        />
        {openInDrawer
          && (
            <DocumentDrawerToggler
              className={`${baseClass}__edit`}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <Edit />
              <Tooltip
                show={hovered}
              >
                Edit
              </Tooltip>
            </DocumentDrawerToggler>
          )}
      </div>
      <div className={`${baseClass}__size-type`}>
        {formatFilesize(filesize)}
        {(width && height) && (
          <React.Fragment>
            &nbsp;-&nbsp;
            {width}
            x
            {height}
          </React.Fragment>
        )}
        {mimeType && (
          <React.Fragment>
            &nbsp;-&nbsp;
            {mimeType}
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default Meta;
