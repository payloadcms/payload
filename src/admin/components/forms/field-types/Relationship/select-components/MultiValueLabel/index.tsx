import React, { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { components, MultiValueProps } from 'react-select';
import { useDocumentDrawer } from '../../../../../elements/DocumentDrawer';
import Tooltip from '../../../../../elements/Tooltip';
import Edit from '../../../../../icons/Edit';
import { useAuth } from '../../../../../utilities/Auth';
import { Option } from '../../types';
import './index.scss';

const baseClass = 'relationship--multi-value-label';

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  const {
    data: {
      value,
      relationTo,
      label,
    },
    customProps: {
      setDrawerIsOpen,
      draggableProps,
      onSave,
    } = {},
  } = props;

  const { permissions } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
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
            aria-label={`Edit ${label}`}
            onTouchEnd={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
            onMouseDown={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(false)}
          >
            <Tooltip
              className={`${baseClass}__tooltip`}
              show={showTooltip}
            >
              {t('editLabel', { label: '' })}
            </Tooltip>
            <Edit />
          </DocumentDrawerToggler>
          <DocumentDrawer onSave={onSave} />
        </Fragment>
      )}
    </div>
  );
};
