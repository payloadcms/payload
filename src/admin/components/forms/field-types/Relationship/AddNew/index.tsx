import React, { useCallback, useEffect, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import Button from '../../../../elements/Button';
import { Props } from './types';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import Popup from '../../../../elements/Popup';
import { useRelatedCollections } from './useRelatedCollections';
import { useAuth } from '../../../../utilities/Auth';
import { AddNewRelationModal } from './Modal';
import { useEditDepth } from '../../../../utilities/EditDepth';
import Plus from '../../../../icons/Plus';

import './index.scss';

const baseClass = 'relationship-add-new';

export const AddNewRelation: React.FC<Props> = ({ path, hasMany, relationTo, value, setValue, dispatchOptions }) => {
  const relatedCollections = useRelatedCollections(relationTo);
  const { toggleModal, isModalOpen } = useModal();
  const { permissions } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [modalCollection, setModalCollection] = useState<SanitizedCollectionConfig>();
  const [popupOpen, setPopupOpen] = useState(false);
  const editDepth = useEditDepth();

  const modalSlug = `${path}-add-modal-depth-${editDepth}`;

  const openModal = useCallback(async (collection: SanitizedCollectionConfig) => {
    setModalCollection(collection);
    toggleModal(modalSlug);
  }, [toggleModal, modalSlug]);

  const onSave = useCallback((json) => {
    const newValue = Array.isArray(relationTo) ? {
      relationTo: modalCollection.slug,
      value: json.doc.id,
    } : json.doc.id;

    dispatchOptions({
      type: 'ADD',
      hasMultipleRelations: Array.isArray(relationTo),
      collection: modalCollection,
      docs: [
        json.doc,
      ],
      sort: true,
    });

    if (hasMany) {
      setValue([...(Array.isArray(value) ? value : []), newValue]);
    } else {
      setValue(newValue);
    }

    setModalCollection(undefined);
    toggleModal(modalSlug);
  }, [relationTo, modalCollection, hasMany, toggleModal, modalSlug, setValue, value, dispatchOptions]);

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
      setModalCollection(undefined);
    }
  }, [isModalOpen, modalSlug]);

  return hasPermission ? (
    <div
      className={baseClass}
      id={`${path}-add-new`}
    >
      {relatedCollections.length === 1 && (
        <Button
          className={`${baseClass}__add-button`}
          onClick={() => openModal(relatedCollections[0])}
          buttonStyle="none"
          tooltip={`Add new ${relatedCollections[0].labels.singular}`}
        >
          <Plus />
        </Button>
      )}
      {relatedCollections.length > 1 && (
        <Popup
          buttonType="custom"
          horizontalAlign="center"
          onToggleOpen={onPopopToggle}
          button={(
            <Button
              className={`${baseClass}__add-button`}
              buttonStyle="none"
              tooltip={popupOpen ? undefined : 'Add new'}
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
                        className={`${baseClass}__relation-button ${baseClass}__relation-button--${relatedCollection.slug}`}
                        type="button"
                        onClick={() => { closePopup(); openModal(relatedCollection); }}
                      >
                        {relatedCollection.labels.singular}
                      </button>
                    </li>
                  );
                }

                return null;
              })}
            </ul>
          )}
        />
      )}
      {modalCollection && (
        <AddNewRelationModal
          {...{ onSave, modalSlug, modalCollection }}
        />
      )}
    </div>
  ) : null;
};
