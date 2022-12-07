import React, { Fragment, useEffect } from 'react';
import { components as SelectComponents, SingleValueProps } from 'react-select';
import { useDocumentDrawer } from '../../../../../elements/DocumentDrawer';
import Edit from '../../../../../icons/Edit';
import { Option } from '../../types';
import './index.scss';

const baseClass = 'single-value';

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
      },
    },
  } = props;

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
          {children}
          {relationTo && (
            <Fragment>
              <DocumentDrawerToggler
                className={`${baseClass}__drawer-toggler`}
                aria-label={`Edit ${label}`}
                onMouseDown={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
              >
                <Edit />
              </DocumentDrawerToggler>
            </Fragment>
          )}
        </SelectComponents.SingleValue>
      </div>
      {relationTo && (
        <DocumentDrawer />
      )}
    </div>
  );
};
