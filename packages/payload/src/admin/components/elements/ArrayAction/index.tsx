import React from 'react';
import { useTranslation } from 'react-i18next';
import Popup from '../Popup.js';
import More from '../../icons/More.js';
import Chevron from '../../icons/Chevron.js';
import { Props } from './types.js';
import Plus from '../../icons/Plus.js';
import X from '../../icons/X.js';
import Copy from '../../icons/Copy.js';

import './index.scss';

const baseClass = 'array-actions';

export const ArrayAction: React.FC<Props> = ({
  moveRow,
  index,
  rowCount,
  addRow,
  duplicateRow,
  removeRow,
  hasMaxRows,
}) => {
  const { t } = useTranslation('general');
  return (
    <Popup
      horizontalAlign="center"
      className={baseClass}
      buttonClassName={`${baseClass}__button`}
      button={<More />}
      render={({ close }) => {
        return (
          <React.Fragment>
            {index !== 0 && (
              <button
                className={`${baseClass}__action ${baseClass}__move-up`}
                type="button"
                onClick={() => {
                  moveRow(index, index - 1);
                  close();
                }}
              >
                <Chevron />
                {t('moveUp')}
              </button>
            )}
            {index < rowCount - 1 && (
              <button
                className={`${baseClass}__action ${baseClass}__move-down`}
                type="button"
                onClick={() => {
                  moveRow(index, index + 1);
                  close();
                }}
              >
                <Chevron />
                {t('moveDown')}
              </button>
            )}
            {!hasMaxRows && (
              <React.Fragment>
                <button
                  className={`${baseClass}__action ${baseClass}__add`}
                  type="button"
                  onClick={() => {
                    addRow(index + 1);
                    close();
                  }}
                >
                  <Plus />
                  {t('addBelow')}
                </button>
                <button
                  className={`${baseClass}__action ${baseClass}__duplicate`}
                  type="button"
                  onClick={() => {
                    duplicateRow(index);
                    close();
                  }}
                >
                  <Copy />
                  {t('duplicate')}
                </button>
              </React.Fragment>
            )}
            <button
              className={`${baseClass}__action ${baseClass}__remove`}
              type="button"
              onClick={() => {
                removeRow(index);
                close();
              }}
            >
              <X />
              {t('remove')}
            </button>
          </React.Fragment>
        );
      }}
    />
  );
};
