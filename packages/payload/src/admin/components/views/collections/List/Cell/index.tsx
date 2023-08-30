import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../utilities/Config/index.js';
import RenderCustomComponent from '../../../../utilities/RenderCustomComponent/index.js';
import cellComponents from './field-types/index.js';
import { Props } from './types.js';
import { getTranslation } from '../../../../../../utilities/getTranslation.js';
import { fieldAffectsData } from '../../../../../../fields/config/types.js';

const DefaultCell: React.FC<Props> = (props) => {
  const {
    field,
    collection,
    collection: {
      slug,
    },
    cellData,
    rowData,
    rowData: {
      id,
    } = {},
    link = true,
    onClick,
    className,
  } = props;

  const { routes: { admin } } = useConfig();
  const { t, i18n } = useTranslation('general');

  let WrapElement: React.ComponentType<any> | string = 'span';

  const wrapElementProps: {
    to?: string
    onClick?: () => void
    type?: 'button'
    className?: string
  } = {
    className,
  };

  if (link) {
    WrapElement = Link;
    wrapElementProps.to = `${admin}/collections/${slug}/${id}`;
  }

  if (typeof onClick === 'function') {
    WrapElement = 'button';
    wrapElementProps.type = 'button';
    wrapElementProps.onClick = () => {
      onClick(props);
    };
  }

  let CellComponent = cellData && cellComponents[field.type];

  if (!CellComponent) {
    if (collection.upload && fieldAffectsData(field) && field.name === 'filename') {
      CellComponent = cellComponents.File;
    } else {
      return (
        <WrapElement {...wrapElementProps}>
          {((cellData === '' || typeof cellData === 'undefined') && 'label' in field) && t('noLabel', { label: getTranslation(typeof field.label === 'function' ? 'data' : field.label || 'data', i18n) })}
          {typeof cellData === 'string' && cellData}
          {typeof cellData === 'number' && cellData}
          {typeof cellData === 'object' && JSON.stringify(cellData)}
        </WrapElement>
      );
    }
  }

  return (
    <WrapElement {...wrapElementProps}>
      <CellComponent
        field={field}
        data={cellData}
        collection={collection}
        rowData={rowData}
      />
    </WrapElement>
  );
};

const Cell: React.FC<Props> = (props) => {
  const {
    colIndex,
    collection,
    cellData,
    rowData,
    field,
    field: {
      admin: {
        components: {
          Cell: CustomCell,
        } = {},
      } = {},
    },
    link,
    onClick,
    className,
  } = props;

  return (
    <RenderCustomComponent
      componentProps={{
        rowData,
        colIndex,
        cellData,
        collection,
        field,
        link,
        onClick,
        className,
      }}
      CustomComponent={CustomCell}
      DefaultComponent={DefaultCell}
    />
  );
};

export default Cell;
