import React, { HTMLAttributes, useCallback, useReducer, useState } from 'react';
import { Transforms } from 'slate';
import { ReactEditor, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../../../utilities/Config';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import FileGraphic from '../../../../../../graphics/File';
import useThumbnail from '../../../../../../../hooks/useThumbnail';
import Button from '../../../../../../elements/Button';
import { getTranslation } from '../../../../../../../../utilities/getTranslation';
import { useDocumentDrawer } from '../../../../../../elements/DocumentDrawer';
import { useUploadsDrawer } from '../../../../../../elements/UploadsDrawer';
import { SanitizedCollectionConfig } from '../../../../../../../../collections/config/types';

import './index.scss';

const baseClass = 'rich-text-upload';

const initialParams = {
  depth: 0,
};

const Element: React.FC<{
  attributes: HTMLAttributes<HTMLDivElement>
  children: React.ReactNode
  element: any
}> = ({ attributes, children, element }) => {
  const { relationTo, value } = element;
  const { collections, serverURL, routes: { api } } = useConfig();
  const { t, i18n } = useTranslation('fields');
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0);
  const [relatedCollection] = useState<SanitizedCollectionConfig>(() => collections.find((coll) => coll.slug === relationTo));

  const [
    UploadsDrawer,
    UploadsDrawerToggler,
  ] = useUploadsDrawer();

  const [
    DocumentDrawer,
    DocumentDrawerToggler,
    {
      closeDrawer,
    },
  ] = useDocumentDrawer({
    collectionSlug: relatedCollection.slug,
    id: value?.id,
  });

  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();

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

  const swapUpload = React.useCallback(({ doc, collectionConfig }) => {
    const newNode = {
      type: 'upload',
      value: { id: doc.id },
      relationTo: collectionConfig.slug,
      children: [
        { text: ' ' },
      ],
    };

    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.setNodes(
      editor,
      newNode,
      { at: elementPath },
    );

    closeDrawer();
  }, [closeDrawer, editor, element]);

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
              <UploadsDrawerToggler>
                <Button
                  icon="swap"
                  round
                  buttonStyle="icon-label"
                  className={`${baseClass}__actionButton`}
                  onClick={() => {
                    // do nothing
                  }}
                  el="div"
                  tooltip={t('swapUpload')}
                />
              </UploadsDrawerToggler>
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
      <UploadsDrawer onSave={swapUpload} />
    </div>
  );
};

export default Element;
