import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types.js';
import type { Props as EditViewProps } from '../../../../views/collections/Edit/types.js';
import type { Value } from '../types.js';
import type { Props } from './types.js';

import { getTranslation } from '../../../../../../utilities/getTranslation.js';
import Button from '../../../../elements/Button/index.js';
import { useDocumentDrawer } from '../../../../elements/DocumentDrawer/index.js';
import Popup from '../../../../elements/Popup/index.js';
import Tooltip from '../../../../elements/Tooltip/index.js';
import Plus from '../../../../icons/Plus/index.js';
import { useAuth } from '../../../../utilities/Auth/index.js';
import { useConfig } from '../../../../utilities/Config/index.js';
import './index.scss';
import { useRelatedCollections } from './useRelatedCollections.js';

const baseClass = 'relationship-add-new';

export const AddNewRelation: React.FC<Props> = ({
  dispatchOptions,
  hasMany,
  path,
  relationTo,
  setValue,
  value,
}) => {
  const relatedCollections = useRelatedCollections(relationTo);
  const { permissions } = useAuth();
  const [show, setShow] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>();
  const relatedToMany = relatedCollections.length > 1;
  const [collectionConfig, setCollectionConfig] = useState<SanitizedCollectionConfig>(() => (!relatedToMany ? relatedCollections[0] : undefined));
  const [popupOpen, setPopupOpen] = useState(false);
  const { i18n, t } = useTranslation('fields');
  const [showTooltip, setShowTooltip] = useState(false);
  const config = useConfig();

  const [
    DocumentDrawer,
    DocumentDrawerToggler,
    { isDrawerOpen, toggleDrawer },
  ] = useDocumentDrawer({
    collectionSlug: collectionConfig?.slug,
  });

  const onSave: EditViewProps['onSave'] = useCallback(({
    doc,
    operation,
  }) => {
    if (operation === 'create') {
      const newValue: Value = Array.isArray(relationTo) ? {
        relationTo: collectionConfig.slug,
        value: doc.id,
      } : doc.id;

      // ensure the value is not already in the array
      const isNewValue = Array.isArray(relationTo) && Array.isArray(value)
        ? !value.some((v) => v && typeof v === 'object' && v.value === doc.id)
        : value !== doc.id;

      if (isNewValue) {
        dispatchOptions({
          collection: collectionConfig,
          config,
          docs: [
            doc,
          ],
          i18n,
          sort: true,
          type: 'ADD',
        });


        if (hasMany) {
          setValue([...(Array.isArray(value) ? value : []), newValue]);
        } else {
          setValue(newValue);
        }
      }

      setSelectedCollection(undefined);
    }
  }, [relationTo, collectionConfig, dispatchOptions, i18n, hasMany, setValue, value, config]);

  const onPopopToggle = useCallback((state) => {
    setPopupOpen(state);
  }, []);

  useEffect(() => {
    if (permissions) {
      if (relatedCollections.length === 1) {
        setShow(permissions.collections[relatedCollections[0].slug].create.permission);
      } else {
        setShow(relatedCollections.some((collection) => permissions.collections[collection.slug].create.permission));
      }
    }
  }, [permissions, relatedCollections]);

  useEffect(() => {
    if (relatedToMany && selectedCollection) {
      setCollectionConfig(relatedCollections.find((collection) => collection.slug === selectedCollection));
    }
  }, [selectedCollection, relatedToMany, relatedCollections]);

  useEffect(() => {
    if (relatedToMany && collectionConfig) {
      // the drawer must be rendered on the page before before opening it
      // this is why 'selectedCollection' is different from 'collectionConfig'
      toggleDrawer();
      setSelectedCollection(undefined);
    }
  }, [toggleDrawer, relatedToMany, collectionConfig]);

  useEffect(() => {
    if (relatedToMany && !isDrawerOpen) {
      setCollectionConfig(undefined);
    }
  }, [isDrawerOpen, relatedToMany]);

  if (show) {
    return (
      <div
        className={baseClass}
        id={`${path}-add-new`}
      >
        {relatedCollections.length === 1 && (
          <Fragment>
            <DocumentDrawerToggler
              className={`${baseClass}__add-button`}
              onClick={() => setShowTooltip(false)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Tooltip
                className={`${baseClass}__tooltip`}
                show={showTooltip}
              >
                {t('addNewLabel', { label: getTranslation(relatedCollections[0].labels.singular, i18n) })}
              </Tooltip>
              <Plus />
            </DocumentDrawerToggler>
            <DocumentDrawer onSave={onSave} />
          </Fragment>
        )}
        {relatedCollections.length > 1 && (
          <Fragment>
            <Popup
              button={(
                <Button
                  buttonStyle="none"
                  className={`${baseClass}__add-button`}
                  tooltip={popupOpen ? undefined : t('addNew')}
                >
                  <Plus />
                </Button>
            )}
              render={({ close: closePopup }) => (
                <ul className={`${baseClass}__relations`}>
                  {relatedCollections.map((relatedCollection) => {
                    if (permissions.collections[relatedCollection.slug].create.permission) {
                      return (
                        <li key={relatedCollection.slug}>
                          <button
                            onClick={() => {
                              closePopup();
                              setSelectedCollection(relatedCollection.slug);
                            }}
                            className={`${baseClass}__relation-button ${baseClass}__relation-button--${relatedCollection.slug}`}
                            type="button"
                          >
                            {getTranslation(relatedCollection.labels.singular, i18n)}
                          </button>
                        </li>
                      );
                    }

                    return null;
                  })}
                </ul>
              )}
              buttonType="custom"
              horizontalAlign="center"
              onToggleOpen={onPopopToggle}
            />
            {collectionConfig && permissions.collections[collectionConfig.slug].create.permission && (
              <DocumentDrawer
                onSave={onSave}
              />
            )}
          </Fragment>
        )}
      </div>
    );
  }
  return null;
};
