import React, { HTMLAttributes, useCallback, useReducer, useState } from 'react';
import { ReactEditor, useFocused, useSelected, useSlateStatic } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { Transforms } from 'slate';
import { useConfig } from '../../../../../../utilities/Config';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import { useDocumentDrawer } from '../../../../../../elements/DocumentDrawer';
import Button from '../../../../../../elements/Button';
import { useListDrawer } from '../../../../../../elements/ListDrawer';
import { Props as RichTextProps } from '../../../types';
import { getTranslation } from '../../../../../../../../utilities/getTranslation';
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition';

import './index.scss';

const baseClass = 'rich-text-relationship';

const initialParams = {
  depth: 0,
};

type Props = {
  attributes: HTMLAttributes<HTMLDivElement>
  children: React.ReactNode
  element: any
  fieldProps: RichTextProps
}
const Element: React.FC<Props> = (props) => {
  const {
    attributes,
    children,
    element,
    element: {
      relationTo,
      value,
    },
    fieldProps,
  } = props;

  const { collections, serverURL, routes: { api } } = useConfig();
  const [enabledCollectionSlugs] = useState(() => collections.filter(({ admin: { enableRichTextRelationship } }) => enableRichTextRelationship).map(({ slug }) => slug));
  const [relatedCollection, setRelatedCollection] = useState(() => collections.find((coll) => coll.slug === relationTo));
  const selected = useSelected();
  const focused = useFocused();
  const { t, i18n } = useTranslation(['fields', 'general']);
  const editor = useSlateStatic();
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0);
  const [{ data }, { setParams }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  );

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

  const removeRelationship = useCallback(() => {
    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.removeNodes(
      editor,
      { at: elementPath },
    );
  }, [editor, element]);

  const updateRelationship = React.useCallback(({ doc }) => {
    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.setNodes(
      editor,
      {
        type: 'relationship',
        value: { id: doc.id },
        relationTo: relatedCollection.slug,
        children: [
          { text: ' ' },
        ],
      },
      { at: elementPath },
    );

    setParams({
      ...initialParams,
      cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
    });

    closeDrawer();
    dispatchCacheBust();
  }, [editor, element, relatedCollection, cacheBust, setParams, closeDrawer]);

  const swapRelationship = React.useCallback(({ docID, collectionConfig }) => {
    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.setNodes(
      editor,
      {
        type: 'relationship',
        value: { id: docID },
        relationTo: collectionConfig.slug,
        children: [
          { text: ' ' },
        ],
      },
      { at: elementPath },
    );

    setRelatedCollection(collections.find((coll) => coll.slug === collectionConfig.slug));

    setParams({
      ...initialParams,
      cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
    });

    closeListDrawer();
    dispatchCacheBust();
  }, [closeListDrawer, editor, element, cacheBust, setParams, collections]);

  return (
    <div
      className={[
        baseClass,
        (selected && focused) && `${baseClass}--selected`,
      ].filter(Boolean).join(' ')}
      contentEditable={false}
      {...attributes}
    >
      <div className={`${baseClass}__wrap`}>
        <p className={`${baseClass}__label`}>
          {t('labelRelationship', { label: getTranslation(relatedCollection.labels.singular, i18n) })}
        </p>
        <DocumentDrawerToggler className={`${baseClass}__doc-drawer-toggler`}>
          <p className={`${baseClass}__title`}>
            {data[relatedCollection?.admin?.useAsTitle || 'id']}
          </p>
        </DocumentDrawerToggler>
      </div>
      <div className={`${baseClass}__actions`}>
        <ListDrawerToggler
          disabled={fieldProps?.admin?.readOnly}
          className={`${baseClass}__list-drawer-toggler`}
        >
          <Button
            icon="swap"
            round
            buttonStyle="icon-label"
            onClick={() => {
              // do nothing
            }}
            el="div"
            tooltip={t('swapRelationship')}
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
            removeRelationship();
          }}
          tooltip={t('fields:removeRelationship')}
          disabled={fieldProps?.admin?.readOnly}
        />
      </div>
      {value?.id && (
        <DocumentDrawer onSave={updateRelationship} />
      )}
      <ListDrawer onSelect={swapRelationship} />
      {children}
    </div>
  );
};

export default (props: Props): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props}>
      <Element {...props} />
    </EnabledRelationshipsCondition>
  );
};
