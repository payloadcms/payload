import React, { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { components, MultiValueProps } from 'react-select';
import { useDocumentDrawer } from '../../../../../elements/DocumentDrawer/index.js';
import Tooltip from '../../../../../elements/Tooltip/index.js';
import Edit from '../../../../../icons/Edit/index.js';
import { useAuth } from '../../../../../utilities/Auth/index.js';
import { Option } from '../../types.js';

import './index.scss';

const baseClass = 'relationship--multi-value-label';

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  const {
    data: {
      value,
      relationTo,
      label,
    },
    selectProps: {
      // @ts-ignore // TODO: Fix types
      customProps: {
        // @ts-ignore // TODO: Fix types
        setDrawerIsOpen,
        // @ts-ignore // TODO: Fix types
        draggableProps,
        // onSave,
      } = {},
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
          <DocumentDrawer onSave={/* onSave */null} />
        </Fragment>
      )}
    </div>
  );
};
