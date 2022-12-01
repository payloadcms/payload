import React, { Fragment } from 'react';
import { components, MultiValueProps } from 'react-select';
import { useDocumentDrawer } from '../../../../elements/DocumentDrawer';
import Edit from '../../../../icons/Edit';
import { Value, ValueAsObject } from '../types';
import './index.scss';

const baseClass = 'multi-value-label';

export const CustomEditButton: React.FC<{
  data: ValueAsObject;
}> = ({ data }) => {
  const { DocumentDrawer, DocumentDrawerToggler } = useDocumentDrawer();
  return (
    <Fragment>
      <DocumentDrawerToggler
        collection={data.relationTo}
        id={data.value.toString()}
        className={`${baseClass}__drawer-toggler`}
      >
        <Edit />
      </DocumentDrawerToggler>
      <DocumentDrawer
        collection={data.relationTo}
        id={data.value.toString()}
      />
    </Fragment>
  );
};

export const MultiValueLabel: React.FC<MultiValueProps<{
  data: Value
}>> = (props) => {
  const {
    data,
  } = props;

  return (
    <div className={baseClass}>
      <components.MultiValueLabel {...props} />
      {typeof data === 'object' && (
        <CustomEditButton data={data as unknown as ValueAsObject} />
      )}
    </div>
  );
};
