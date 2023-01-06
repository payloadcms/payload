import React, { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { components, MultiValueProps } from 'react-select';
import { useDocumentDrawer } from '../../../../../elements/DocumentDrawer';
import Tooltip from '../../../../../elements/Tooltip';
import Edit from '../../../../../icons/Edit';
import { useAuth } from '../../../../../utilities/Auth';
import { Option } from '../../types';
import './index.scss';
import Open from '../../../../../icons/Open';

const baseClass = 'relationship--multi-value-label';

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  const {
    data: {
      value,
      relationTo,
      label,
    },
    selectProps: {
      setDrawerIsOpen,
      draggableProps,
      onSave,
    },
  } = props;

  const { permissions } = useAuth();
  const [showEditTooltip, setShowEditTooltip] = useState(false);
  const [showOpenTooltip, setShowOpenTooltip] = useState(false);

  const { t } = useTranslation('general');
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read?.permission);

  const [DocumentDrawer, DocumentDrawerToggler, { isDrawerOpen }] = useDocumentDrawer({
    id: value?.toString(),
    collectionSlug: relationTo,
  });

  useEffect(() => {
    if (typeof setDrawerIsOpen === 'function') setDrawerIsOpen(isDrawerOpen);
  }, [isDrawerOpen, setDrawerIsOpen]);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__content`}>
        <components.MultiValueLabel
          {...props}
          innerProps={{
            className: `${baseClass}__text`,
            ...draggableProps || {},
          }}
        />
      </div>
      {relationTo && hasReadPermission && (
        <Fragment>
          <DocumentDrawerToggler
            className={`${baseClass}__drawer-toggler`}
            style={{ pointerEvents: 'all' }}
            aria-label={`Edit ${label}`}
            onMouseEnter={() => setShowEditTooltip(true)}
            onMouseLeave={() => setShowEditTooltip(false)}
            onClick={() => setShowEditTooltip(false)}
          >
            <Tooltip
              className={`${baseClass}__tooltip`}
              show={showEditTooltip}
            >
              {t('editLabel', { label: '' })}
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
              {t('fields:openInNewTab')}
            </Tooltip>
            <Open />
          </a>
          <DocumentDrawer onSave={onSave} />
        </Fragment>
      )}
    </div>
  );
};
