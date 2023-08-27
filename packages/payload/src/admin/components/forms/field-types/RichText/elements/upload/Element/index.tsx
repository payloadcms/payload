import React, { HTMLAttributes, useCallback, useReducer, useState } from 'react';
import { Transforms } from 'slate';
import { ReactEditor, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../../../utilities/Config/index.js';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI.js';
import FileGraphic from '../../../../../../graphics/File/index.js';
import useThumbnail from '../../../../../../../hooks/useThumbnail.js';
import Button from '../../../../../../elements/Button/index.js';
import { getTranslation } from '../../../../../../../../utilities/getTranslation.js';
import { useDocumentDrawer } from '../../../../../../elements/DocumentDrawer/index.js';
import { useListDrawer } from '../../../../../../elements/ListDrawer/index.js';
import { SanitizedCollectionConfig } from '../../../../../../../../collections/config/types.js';
import { Props as RichTextProps } from '../../../types.js';
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition.js';
import { useDrawerSlug } from '../../../../../../elements/Drawer/useDrawerSlug.js';
import { UploadDrawer } from './UploadDrawer/index.js';
import { DrawerToggler } from '../../../../../../elements/Drawer/index.js';

import './index.scss';

const baseClass = 'rich-text-upload';

const initialParams = {
  depth: 0,
};

export type ElementProps = {
  attributes: HTMLAttributes<HTMLDivElement>
  children: React.ReactNode
  element: any
  fieldProps: RichTextProps
  enabledCollectionSlugs: string[]
}

const Element: React.FC<ElementProps> = (props) => {
  const {
    attributes,
    children,
    element,
    element: {
      relationTo,
      value,
    },
    fieldProps,
    enabledCollectionSlugs,
  } = props;

  const { collections, serverURL, routes: { api } } = useConfig();
  const { t, i18n } = useTranslation('fields');
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0);
  const [relatedCollection, setRelatedCollection] = useState<SanitizedCollectionConfig>(() => collections.find((coll) => coll.slug === relationTo));

  const drawerSlug = useDrawerSlug('upload-drawer');

  const [
    ListDrawer,
    ListDrawerToggler,
    {
      closeDrawer: closeListDrawer,
    },
  ] = useListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    selectedCollection: relatedCollection.slug,
  });

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

    // setRelatedCollection(collections.find((coll) => coll.slug === collectionConfig.slug));

    setParams({
      ...initialParams,
      cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
    });

    dispatchCacheBust();
    closeDrawer();
  }, [editor, element, setParams, cacheBust, closeDrawer]);

  const swapUpload = React.useCallback(({ docID, collectionConfig }) => {
    const newNode = {
      type: 'upload',
      value: { id: docID },
      relationTo: collectionConfig.slug,
      children: [
        { text: ' ' },
      ],
    };

    const elementPath = ReactEditor.findPath(editor, element);

    setRelatedCollection(collections.find((coll) => coll.slug === collectionConfig.slug));

    Transforms.setNodes(
      editor,
      newNode,
      { at: elementPath },
    );

    dispatchCacheBust();
    closeListDrawer();
  }, [closeListDrawer, editor, element, collections]);

  const customFields = fieldProps?.admin?.upload?.collections?.[relatedCollection.slug]?.fields;

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
              {customFields?.length > 0 && (
                <DrawerToggler
                  slug={drawerSlug}
                  className={`${baseClass}__upload-drawer-toggler`}
                  disabled={fieldProps?.admin?.readOnly}
                >
                  <Button
                    icon="edit"
                    round
                    buttonStyle="icon-label"
                    el="div"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                    tooltip={t('fields:editRelationship')}
                  />
                </DrawerToggler>
              )}
              <ListDrawerToggler
                className={`${baseClass}__list-drawer-toggler`}
                disabled={fieldProps?.admin?.readOnly}
              >
                <Button
                  icon="swap"
                  round
                  buttonStyle="icon-label"
                  onClick={() => {
                    // do nothing
                  }}
                  el="div"
                  tooltip={t('swapUpload')}
                  disabled={fieldProps?.admin?.readOnly}
                />
              </ListDrawerToggler>
              <Button
                icon="x"
                round
                buttonStyle="icon-label"
                className={`${baseClass}__removeButton`}
                onClick={(e) => {
                  e.preventDefault();
                  removeUpload();
                }}
                tooltip={t('removeUpload')}
                disabled={fieldProps?.admin?.readOnly}
              />
            </div>
          </div>
        </div>
        <div className={`${baseClass}__bottomRow`}>
          <DocumentDrawerToggler className={`${baseClass}__doc-drawer-toggler`}>
            <strong>
              {data?.filename}
            </strong>
          </DocumentDrawerToggler>
        </div>
      </div>
      {children}
      {value?.id && (
        <DocumentDrawer onSave={updateUpload} />
      )}
      <ListDrawer onSelect={swapUpload} />
      <UploadDrawer
        drawerSlug={drawerSlug}
        relatedCollection={relatedCollection}
        {...props}
      />
    </div>
  );
};

export default (props: ElementProps): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition
      {...props}
      uploads
    >
      <Element {...props} />
    </EnabledRelationshipsCondition>
  );
};
