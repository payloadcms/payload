import React, { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { components as SelectComponents, SingleValueProps } from 'react-select';
import { useDocumentDrawer } from '../../../../../elements/DocumentDrawer';
import Tooltip from '../../../../../elements/Tooltip';
import Edit from '../../../../../icons/Edit';
import Open from '../../../../../icons/Open';
import { useAuth } from '../../../../../utilities/Auth';
import { Option } from '../../types';
import './index.scss';

const baseClass = 'relationship--single-value';

export const SingleValue: React.FC<SingleValueProps<Option>> = (props) => {
  const {
    data: {
      value,
      relationTo,
      label,
    },
    children,
    selectProps: {
      selectProps: {
        setDrawerIsOpen,
        onSave,
      },
    },
  } = props;

  const [showEditTooltip, setShowEditTooltip] = useState(false);
  const [showOpenTooltip, setShowOpenTooltip] = useState(false);

  const { t } = useTranslation('general');
  const { permissions } = useAuth();
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read?.permission);

  const [DocumentDrawer, DocumentDrawerToggler, { isDrawerOpen }] = useDocumentDrawer({
    id: value.toString(),
    collectionSlug: relationTo,
  });

  useEffect(() => {
    if (typeof setDrawerIsOpen === 'function') setDrawerIsOpen(isDrawerOpen);
  }, [isDrawerOpen, setDrawerIsOpen]);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__label`}>
        <SelectComponents.SingleValue {...props}>
          <div className={`${baseClass}__text`}>
            {children}
          </div>
          {relationTo && hasReadPermission && (
            <Fragment>
              <DocumentDrawerToggler
                className={`${baseClass}__drawer-toggler`}
                style={{ pointerEvents: 'all' }}
                aria-label={t('editLabel', { label })}
                onMouseDown={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
                onMouseEnter={() => setShowEditTooltip(true)}
                onMouseLeave={() => setShowEditTooltip(false)}
                onClick={() => setShowEditTooltip(false)}
              >
                <Tooltip
                  className={`${baseClass}__tooltip`}
                  show={showEditTooltip}
                >
                  {t('edit')}
                </Tooltip>
                <Edit />
              </DocumentDrawerToggler>
              <a
                href={`/admin/collections/${relationTo}/${value}`}
                target="_blank"
                onMouseDown={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
                onMouseEnter={() => setShowOpenTooltip(true)}
                onMouseLeave={() => setShowOpenTooltip(false)}
                onClick={() => setShowOpenTooltip(false)}
                className={`${baseClass}__open-link`}
                style={{ pointerEvents: 'all' }}
                rel="noreferrer"
              >
                <Tooltip
                  className={`${baseClass}__tooltip`}
                  show={showOpenTooltip}
                >
                  {t('open')}
                </Tooltip>
                <Open />
              </a>
            </Fragment>
          )}
        </SelectComponents.SingleValue>
      </div>
      {relationTo && hasReadPermission && (
        <DocumentDrawer onSave={onSave} />
      )}
    </div>
  );
};
