import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectAllStatus, useSelection } from '../../views/collections/List/SelectionProvider';

import './index.scss';

const baseClass = 'list-selection';

type Props = {
  label: string
}
const ListSelection: React.FC<Props> = ({ label }) => {
  const { toggleAll, count, totalDocs, selectAll } = useSelection();
  const { t } = useTranslation('general');

  if (count === 0) {
    return null;
  }

  return (
    <div className={baseClass}>
      <span>{t('selectedCount', { label, count })}</span>
      { selectAll !== SelectAllStatus.AllAvailable && (
        <Fragment>
          {' '}
          &mdash;
          <button
            className={`${baseClass}__button`}
            type="button"
            onClick={() => toggleAll(true)}
            aria-label={t('selectAll', { label, count })}
          >
            {t('selectAll', { label, count: totalDocs })}
          </button>
        </Fragment>
      ) }
    </div>
  );
};

export default ListSelection;
