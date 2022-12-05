import React, { Fragment, useId } from 'react';
import { components, SingleValueProps } from 'react-select';
import { useDocumentDrawer } from '../../DocumentDrawer';
import Edit from '../../../icons/Edit';
import { Option } from '../../../forms/field-types/Relationship/types';
import './index.scss';
import { useDrawerDepth } from '../../Drawer';

const baseClass = 'single-value';

export const SingleValue: React.FC<SingleValueProps<Option>> = (props) => {
  const {
    data: {
      value,
      relationTo,
      label,
    },
    children,
  } = props;

  const drawerDepth = useDrawerDepth();
  const { DocumentDrawer, DocumentDrawerToggler, formatDocumentDrawerSlug } = useDocumentDrawer();
  const uuid = useId();

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__label`}>
        <components.SingleValue {...props}>
          {children}
          {relationTo && (
            <Fragment>
              <DocumentDrawerToggler
                collection={relationTo}
                id={value.toString()}
                uuid={uuid}
                className={`${baseClass}__drawer-toggler`}
                aria-label={`Edit ${label}`}
                onMouseDown={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
              >
                <Edit />
              </DocumentDrawerToggler>
            </Fragment>
          )}
        </components.SingleValue>
      </div>
      {relationTo && (
        <DocumentDrawer
          // use `key` to force the drawer to re-mount when the value changes
          key={formatDocumentDrawerSlug({
            collection: relationTo,
            id: value.toString(),
            depth: drawerDepth,
            uuid,
          })}
          collection={relationTo}
          id={value.toString()}
          uuid={uuid}
        />
      )}
    </div>
  );
};
