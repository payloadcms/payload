import React, { HTMLAttributes, useCallback, useReducer, useState } from 'react';
import { ReactEditor, useFocused, useSelected, useSlateStatic } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { Transforms } from 'slate';
import { useConfig } from '../../../../../../utilities/Config';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import { useDocumentDrawer } from '../../../../../../elements/DocumentDrawer';
import Button from '../../../../../../elements/Button';

import './index.scss';

const baseClass = 'rich-text-relationship';

const initialParams = {
  depth: 0,
};

const Element: React.FC<{
  attributes: HTMLAttributes<HTMLDivElement>
  children: React.ReactNode
  element: any
}> = (props) => {
  const { attributes, children, element } = props;
  const { relationTo, value } = element;
  const { collections, serverURL, routes: { api } } = useConfig();
  const [relatedCollection] = useState(() => collections.find((coll) => coll.slug === relationTo));
  const selected = useSelected();
  const focused = useFocused();
  const { t } = useTranslation(['fields', 'general']);
  const editor = useSlateStatic();
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0);

  const [
    DocumentDrawer,
    DocumentDrawerToggler,
  ] = useDocumentDrawer({
    collectionSlug: relatedCollection.slug,
    id: value?.id,
  });

  const [{ data }, { setParams }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  );

  const removeRelationship = useCallback(() => {
    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.removeNodes(
      editor,
      { at: elementPath },
    );
  }, [editor, element]);

  const updateRelationship = React.useCallback((json) => {
    const { doc } = json;

    const newNode = {
      type: 'relationship',
      value: { id: doc.id },
      relationTo: relatedCollection.slug,
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

    setParams({
      ...initialParams,
      cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
    });

    dispatchCacheBust();
  }, [editor, element, relatedCollection, cacheBust, setParams]);

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
          {t('labelRelationship', { label: relatedCollection.labels.singular })}
        </p>
        <p className={`${baseClass}__title`}>
          {data[relatedCollection?.admin?.useAsTitle || 'id']}
        </p>
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
              tooltip={t('general:editLabel', { label: relatedCollection.labels.singular })}
            />
          </DocumentDrawerToggler>
        )}
        <Button
          icon="swap"
          round
          buttonStyle="icon-label"
          className={`${baseClass}__actionButton`}
          onClick={() => {
            // do nothing
          }}
          el="div"
          tooltip={t('swapRelationship')}
        />
        <Button
          icon="x"
          round
          buttonStyle="icon-label"
          className={`${baseClass}__actionButton`}
          onClick={(e) => {
            e.preventDefault();
            removeRelationship();
          }}
          tooltip={t('fields:removeRelationship')}
        />
      </div>
      {value?.id && (
        <DocumentDrawer onSave={updateRelationship} />
      )}
      {children}
    </div>
  );
};

export default Element;
