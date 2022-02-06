import { useConfig } from '@payloadcms/config-provider';
import React from 'react';
import Button from '../Button';
import { Props } from './types';

import './index.scss';
import { useDocumentInfo } from '../../utilities/DocumentInfo';

const baseClass = 'versions-count';

const Versions: React.FC<Props> = ({ collection, global, id }) => {
  const { routes: { admin } } = useConfig();
  const { versions } = useDocumentInfo();

  let versionsURL: string;

  if (collection) {
    versionsURL = `${admin}/collections/${collection.slug}/${id}/versions`;
  }

  if (global) {
    versionsURL = `${admin}/globals/${global.slug}/versions`;
  }

  return (
    <div className={baseClass}>
      {versions?.docs && (
        <React.Fragment>
          {versions.docs.length === 0 && (
            <React.Fragment>
              No versions found
            </React.Fragment>
          )}
          {versions?.docs?.length > 0 && (
            <React.Fragment>
              <Button
                className={`${baseClass}__button`}
                buttonStyle="none"
                el="link"
                to={versionsURL}
              >
                {versions.totalDocs}
                {' '}
                version
                {versions.totalDocs > 1 && 's'}
                {' '}
                found
              </Button>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </div>
  );
};
export default Versions;
