import React, { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { components, MultiValueProps } from 'react-select';
import { useDocumentDrawer } from '../../../../../elements/DocumentDrawer';
import Tooltip from '../../../../../elements/Tooltip';
import Edit from '../../../../../icons/Edit';
import { useAuth } from '../../../../../utilities/Auth';
import { Option } from '../../types';
import './index.scss';
import Drag from '../../../../../icons/Drag';
import { Link } from 'react-router-dom';

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

  const { t } = useTranslation('general');
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read?.permission);

  const [DocumentDrawer, DocumentDrawerToggler, { isDrawerOpen }] = useDocumentDrawer({
    id: value?.toString(),
    collectionSlug: relationTo,
  });

  useEffect(() => {
    if (typeof setDrawerIsOpen === 'function') setDrawerIsOpen(isDrawerOpen);
  }, [isDrawerOpen, setDrawerIsOpen]);

  console.log(showEditTooltip)

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__drag-handle`}>
        <components.MultiValueLabel
          {...props}
          innerProps={draggableProps}
        >
          <Drag />
        </components.MultiValueLabel>
      </div>
      {relationTo && hasReadPermission && (
        <Fragment>
          <div className={`${baseClass}__content`}>
            <Link
              to={`/admin/collections/${relationTo}/${value}`}
              style={{ pointerEvents: 'all', position: 'relative' }}
              className={`${baseClass}__label`}
            >
              {label}
            </Link>
          </div>
          <DocumentDrawerToggler
            className={`${baseClass}__drawer-toggler`}
            aria-label={`Edit ${label}`}
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
          <DocumentDrawer onSave={onSave} />
        </Fragment>
      )}
    </div>
  );
};
