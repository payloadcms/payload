import React, { Fragment } from 'react';
import { components, MultiValueProps } from 'react-select';
import { useDocumentDrawer } from '../../DocumentDrawer';
import Edit from '../../../icons/Edit';
import { Option } from '../../../forms/field-types/Relationship/types';
import './index.scss';

const baseClass = 'multi-value-label';

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  const {
    data: {
      value,
      relationTo,
      label,
    },
    selectProps,
  } = props;

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    id: value?.toString(),
    collectionSlug: relationTo,
  });

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__label`}>
        <components.MultiValueLabel
          {...props}
          innerProps={{
            ...selectProps?.draggableProps || {},
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
