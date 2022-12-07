import React, { Fragment, useEffect } from 'react';
import { components, MultiValueProps } from 'react-select';
import { useDocumentDrawer } from '../../../../../elements/DocumentDrawer';
import Edit from '../../../../../icons/Edit';
import { Option } from '../../types';
import './index.scss';

const baseClass = 'multi-value-label';

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
    },
  } = props;

  const [DocumentDrawer, DocumentDrawerToggler, { isDrawerOpen }] = useDocumentDrawer({
    id: value?.toString(),
    collectionSlug: relationTo,
  });

  useEffect(() => {
    if (typeof setDrawerIsOpen === 'function') setDrawerIsOpen(isDrawerOpen);
  }, [isDrawerOpen, setDrawerIsOpen]);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__label`}>
        <components.MultiValueLabel
          {...props}
          innerProps={{
            ...draggableProps || {},
          }}
        />
      </div>
      {relationTo && (
        <Fragment>
          <DocumentDrawerToggler
            className={`${baseClass}__drawer-toggler`}
            aria-label={`Edit ${label}`}
          >
            <Edit />
          </DocumentDrawerToggler>
          <DocumentDrawer />
        </Fragment>
      )}
    </div>
  );
};
