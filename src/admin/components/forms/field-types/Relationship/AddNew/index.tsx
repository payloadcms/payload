import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../elements/Button';
import { Props } from './types';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import Popup from '../../../../elements/Popup';
import { useRelatedCollections } from './useRelatedCollections';
import { useAuth } from '../../../../utilities/Auth';
import Plus from '../../../../icons/Plus';
import { getTranslation } from '../../../../../../utilities/getTranslation';
import Tooltip from '../../../../elements/Tooltip';
import { useDocumentDrawer } from '../../../../elements/DocumentDrawer';

import './index.scss';

const baseClass = 'relationship-add-new';

export const AddNewRelation: React.FC<Props> = ({ path, hasMany, relationTo, value, setValue, dispatchOptions }) => {
  const relatedCollections = useRelatedCollections(relationTo);
  const { permissions } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<SanitizedCollectionConfig>(() => {
    if (relatedCollections.length === 1) {
      return relatedCollections[0];
    }

    return undefined;
  });
  const [popupOpen, setPopupOpen] = useState(false);
  const { t, i18n } = useTranslation('fields');
  const [showTooltip, setShowTooltip] = useState(false);
  const [
    DocumentDrawer,
    DocumentDrawerToggler,
    { toggleDrawer },
  ] = useDocumentDrawer({
    collectionSlug: selectedCollection?.slug,
  });

  const onSave = useCallback((json) => {
    const newValue = Array.isArray(relationTo) ? {
      relationTo: selectedCollection.slug,
      value: json.doc.id,
    } : json.doc.id;

    dispatchOptions({
      type: 'ADD',
      collection: selectedCollection,
      docs: [
        json.doc,
      ],
      sort: true,
      i18n,
    });

    if (hasMany) {
      setValue([...(Array.isArray(value) ? value : []), newValue]);
    } else {
      setValue(newValue);
    }

    setSelectedCollection(undefined);
  }, [relationTo, selectedCollection, dispatchOptions, i18n, hasMany, setValue, value]);

  const onPopopToggle = useCallback((state) => {
    setPopupOpen(state);
  }, []);

  useEffect(() => {
    if (permissions) {
      if (relatedCollections.length === 1) {
        setHasPermission(permissions.collections[relatedCollections[0].slug].create.permission);
      } else {
        setHasPermission(relatedCollections.some((collection) => permissions.collections[collection.slug].create.permission));
      }
    }
  }, [permissions, relatedCollections]);

  useEffect(() => {
    if (relatedCollections.length > 1 && selectedCollection) {
      // the drawer must be rendered on the page before before opening it
      toggleDrawer();
    }
  }, [selectedCollection, toggleDrawer, relatedCollections]);

  return hasPermission ? (
    <div
      className={baseClass}
      id={`${path}-add-new`}
    >
      {relatedCollections.length === 1 && (
        <Fragment>
          <DocumentDrawerToggler
            className={`${baseClass}__add-button`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {showTooltip && (
              <Tooltip className={`${baseClass}__tooltip`}>
                {t('addNewLabel', { label: relatedCollections[0].labels.singular })}
              </Tooltip>
            )}
            <Plus />
          </DocumentDrawerToggler>
          <DocumentDrawer onSave={onSave} />
        </Fragment>
      )}
      {relatedCollections.length > 1 && (
        <Fragment>
          <Popup
            buttonType="custom"
            horizontalAlign="center"
            onToggleOpen={onPopopToggle}
            button={(
              <Button
                className={`${baseClass}__add-button`}
                buttonStyle="none"
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
                          type="button"
                          className={`${baseClass}__relation-button ${baseClass}__relation-button--${relatedCollection.slug}`}
                          onClick={() => {
                            closePopup();
                            setSelectedCollection(relatedCollection);
                          }}
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
          />
          {selectedCollection && permissions.collections[selectedCollection.slug].create.permission && (
            <DocumentDrawer onSave={onSave} />
          )}
        </Fragment>
      )}
    </div>
  ) : null;
};
