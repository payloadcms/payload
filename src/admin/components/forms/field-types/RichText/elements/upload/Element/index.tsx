import React, { useState, useCallback, useReducer, useEffect } from 'react';
import { useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { ReactEditor, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../../../utilities/Config';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import FileGraphic from '../../../../../../graphics/File';
import useThumbnail from '../../../../../../../hooks/useThumbnail';
import Button from '../../../../../../elements/Button';
import { SanitizedCollectionConfig } from '../../../../../../../../collections/config/types';
import { SwapUploadModal } from './SwapUploadModal';
import { getTranslation } from '../../../../../../../../utilities/getTranslation';
import { useDocumentDrawer } from '../../../../../../elements/DocumentDrawer';

import './index.scss';

const baseClass = 'rich-text-upload';

const initialParams = {
  depth: 0,
};

const Element = ({ attributes, children, element, path }) => {
  const { relationTo, value } = element;
  const { openModal, closeModal } = useModal();
  const { collections, serverURL, routes: { api } } = useConfig();
  const [renderSwapModal, setRenderSwapModal] = useState(false);
  const [relatedCollection, setRelatedCollection] = useState<SanitizedCollectionConfig>(() => collections.find((coll) => coll.slug === relationTo));
  const { t, i18n } = useTranslation('fields');
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0);

  const [
    DocumentDrawer,
    DocumentDrawerToggler,
  ] = useDocumentDrawer({
    collectionSlug: relatedCollection.slug,
    id: value?.id,
  });

  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();

  const modalSlug = `${path}-edit-data-swap`;

  // Get the referenced document
  const [{ data }, { setParams }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  );

  const thumbnailSRC = useThumbnail(relatedCollection, data);

  const removeUpload = useCallback(() => {
    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.removeNodes(
      editor,
      { at: elementPath },
    );
  }, [editor, element]);


  const updateUpload = useCallback((json) => {
    const { doc } = json;

    const newNode = {
      fields: doc,
    };

    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.setNodes(
      editor,
      newNode,
      { at: elementPath },
    );

    setParams({
      ...initialParams,
      cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
    });

    dispatchCacheBust();
  }, [editor, element, setParams, cacheBust]);

  return (
    <div
      className={[
        baseClass,
        (selected && focused) && `${baseClass}--selected`,
      ].filter(Boolean).join(' ')}
      contentEditable={false}
      {...attributes}
    >
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__topRow`}>
          <div className={`${baseClass}__thumbnail`}>
            {thumbnailSRC ? (
              <img
                src={thumbnailSRC}
                alt={data?.filename}
              />
            ) : (
              <FileGraphic />
            )}
          </div>
          <div className={`${baseClass}__topRowRightPanel`}>
            <div className={`${baseClass}__collectionLabel`}>
              {getTranslation(relatedCollection.labels.singular, i18n)}
            </div>
            <div className={`${baseClass}__actions`}>
              {value?.id && (
                <DocumentDrawerToggler className={`${baseClass}__toggler`}>
                  <Button
                    icon="edit"
                    round
                    buttonStyle="icon-label"
                    el="div"
                    className={`${baseClass}__actionButton`}
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                    tooltip={t('general:edit')}
                  />
                </DocumentDrawerToggler>
              )}
              <Button
                icon="swap"
                round
                buttonStyle="icon-label"
                className={`${baseClass}__actionButton`}
                onClick={(e) => {
                  e.preventDefault();
                  setRenderSwapModal(true);
                  openModal(modalSlug);
                }}
                tooltip={t('swapUpload')}
              />
              <Button
                icon="x"
                round
                buttonStyle="icon-label"
                className={`${baseClass}__actionButton`}
                onClick={(e) => {
                  e.preventDefault();
                  removeUpload();
                }}
                tooltip={t('removeUpload')}
              />
            </div>
          </div>
        </div>
        <div className={`${baseClass}__bottomRow`}>
          <strong>
            {data?.filename}
          </strong>
        </div>
      </div>
      {children}
      {value?.id && (
        <DocumentDrawer onSave={updateUpload} />
      )}
      {renderSwapModal && (
        <SwapUploadModal
          slug={modalSlug}
          element={element}
          closeModal={() => {
            closeModal(modalSlug);
            setRenderSwapModal(false);
          }}
          setRelatedCollectionConfig={setRelatedCollection}
          relatedCollectionConfig={relatedCollection}
        />
      )}
    </div>
  );
};

export default Element;
