import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import Button from '../../../../elements/Button';
import { Props } from './types';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import Popup from '../../../../elements/Popup';
import { useRelatedCollections } from './useRelatedCollections';
import { useAuth } from '../../../../utilities/Auth';
import { useEditDepth } from '../../../../utilities/EditDepth';
import Plus from '../../../../icons/Plus';
import { getTranslation } from '../../../../../../utilities/getTranslation';
import { DocumentDrawer, DocumentDrawerToggler } from '../../../../elements/DocumentDrawer';
import Tooltip from '../../../../elements/Tooltip';

import './index.scss';

const baseClass = 'relationship-add-new';

export const AddNewRelation: React.FC<Props> = ({ path, hasMany, relationTo, value, setValue, dispatchOptions }) => {
  const relatedCollections = useRelatedCollections(relationTo);
  const { isModalOpen } = useModal();
  const { permissions } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<SanitizedCollectionConfig>();
  const [popupOpen, setPopupOpen] = useState(false);
  const editDepth = useEditDepth();
  const { t, i18n } = useTranslation('fields');
  const [showTooltip, setShowTooltip] = useState(false);

  const modalSlug = `${path}-add-modal-depth-${editDepth}`;

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
    // toggleModal(modalSlug);
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
    if (!isModalOpen(modalSlug)) {
      setSelectedCollection(undefined);
    }
  }, [isModalOpen, modalSlug]);

  return hasPermission ? (
    <div
      className={baseClass}
      id={`${path}-add-new`}
    >
      {relatedCollections.length === 1 && (
        <Fragment>
          <DocumentDrawerToggler
            className={`${baseClass}__add-button`}
            collection={relatedCollections[0].slug}
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
          {relatedCollections[0] && (
            <DocumentDrawer
              collection={relatedCollections[0].slug}
              onSave={onSave}
            />
          )}
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
                        <DocumentDrawerToggler
                          collection={relatedCollection.slug}
                          className={`${baseClass}__relation-button ${baseClass}__relation-button--${relatedCollection.slug}`}
                          onClick={() => {
                            closePopup();
                            setSelectedCollection(relatedCollection);
                          }}
                        >
                          {getTranslation(relatedCollection.labels.singular, i18n)}
                        </DocumentDrawerToggler>
                      </li>
                    );
                  }

                  return null;
                })}
              </ul>
            )}
          />
          {selectedCollection && (
            <DocumentDrawer
              collection={selectedCollection.slug}
              onSave={onSave}
            />
          )}
        </Fragment>
      )}
    </div>
  ) : null;
};
