import React, { useCallback, useEffect, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import Button from '../../../../elements/Button';
import { Props } from './types';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import Popup from '../../../../elements/Popup';
import { useRelatedCollections } from './useRelatedCollections';
import { useAuth } from '../../../../utilities/Auth';
import { AddNewRelationModal } from './Modal';

import './index.scss';
import { useEditDepth } from '../../../../utilities/EditDepth';

const baseClass = 'relationship-add-new';

export const AddNewRelation: React.FC<Props> = ({ path, hasMany, relationTo, value, setValue, dispatchOptions }) => {
  const relatedCollections = useRelatedCollections(relationTo);
  const { toggleModal, modalState } = useModal();
  const { permissions } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [modalCollection, setModalCollection] = useState<SanitizedCollectionConfig>();
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
    if (!modalState[modalSlug]?.isOpen) {
      setModalCollection(undefined);
    }
  }, [modalState, modalSlug]);

  return hasPermission ? (
    <React.Fragment>
      {relatedCollections.length === 1 && (
        <Button
          onClick={() => openModal(relatedCollections[0])}
          id={`${path}-add-new`}
          buttonStyle="icon-label"
          icon="plus"
          iconStyle="with-border"
          iconPosition="left"
        >
          {`Add new ${relatedCollections[0].labels.singular}`}
        </Button>
      )}
      {relatedCollections.length > 1 && (
        <Popup
          buttonType="custom"
          horizontalAlign="left"
          button={(
            <Button
              buttonStyle="icon-label"
              id={`${path}-add-new`}
              icon="plus"
              iconPosition="left"
              iconStyle="with-border"
            >
              Add new
            </Button>
          )}
          render={({ close: closePopup }) => (
            <ul className={`${baseClass}__relations`}>
              {relatedCollections.map((relatedCollection) => {
                if (permissions.collections[relatedCollection.slug].create.permission) {
                  return (
                    <li key={relatedCollection.slug}>
                      <button
                        className={`${baseClass}__button`}
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
    </React.Fragment>
  ) : null;
};
