import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import Button from '../Button';
import { Props } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';

import './index.scss';

const baseClass = 'versions-count';

const VersionsCount: React.FC<Props> = ({ collection, global, id }) => {
  const { routes: { admin } } = useConfig();
  const { versions } = useDocumentInfo();
  const { t } = useTranslation('version');

  let versionsURL: string;

  if (collection) {
    versionsURL = `${admin}/collections/${collection.slug}/${id}/versions`;
  }

  if (global) {
    versionsURL = `${admin}/globals/${global.slug}/versions`;
  }

  const versionCount = versions?.totalDocs || 0;

  return (
    <div className={baseClass}>
      {versionCount === 0 && t('versionCount_none')}
      {versionCount > 0 && (
        <Button
          className={`${baseClass}__button`}
          buttonStyle="none"
          el="link"
          to={versionsURL}
        >
          {t(versionCount === 1 ? 'versionCount_one' : 'versionCount_many', { count: versionCount })}
        </Button>
      )}
    </div>
  );
};
export default VersionsCount;
