import { useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { ReactEditor, useSlateStatic } from 'slate-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ElementProps } from '../index.js';
import fieldTypes from '../../../../../index.js';
import { SanitizedCollectionConfig } from '../../../../../../../../../collections/config/types.js';
import { Drawer } from '../../../../../../../elements/Drawer/index.js';
import { useAuth } from '../../../../../../../utilities/Auth/index.js';
import { useLocale } from '../../../../../../../utilities/Locale/index.js';
import Form from '../../../../../../Form/index.js';
import RenderFields from '../../../../../../RenderFields/index.js';
import FormSubmit from '../../../../../../Submit/index.js';
import buildStateFromSchema from '../../../../../../Form/buildStateFromSchema/index.js';
import { getTranslation } from '../../../../../../../../../utilities/getTranslation.js';
import deepCopyObject from '../../../../../../../../../utilities/deepCopyObject.js';
import { useDocumentInfo } from '../../../../../../../utilities/DocumentInfo/index.js';

export const UploadDrawer: React.FC<ElementProps & {
  drawerSlug: string
  relatedCollection: SanitizedCollectionConfig
}> = (props) => {
  const editor = useSlateStatic();

  const {
    fieldProps,
    relatedCollection,
    drawerSlug,
    element,
  } = props;

  const { t, i18n } = useTranslation();
  const { code: locale } = useLocale();
  const { user } = useAuth();
  const { closeModal } = useModal();
  const { getDocPreferences } = useDocumentInfo();
  const [initialState, setInitialState] = useState({});
  const fieldSchema = fieldProps?.admin?.upload?.collections?.[relatedCollection.slug]?.fields;

  const handleUpdateEditData = useCallback((_, data) => {
    const newNode = {
      fields: data,
    };

    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.setNodes(
      editor,
      newNode,
      { at: elementPath },
    );
    closeModal(drawerSlug);
  }, [closeModal, editor, element, drawerSlug]);

  useEffect(() => {
    const awaitInitialState = async () => {
      const preferences = await getDocPreferences();
      const state = await buildStateFromSchema({ fieldSchema, preferences, data: deepCopyObject(element?.fields || {}), user, operation: 'update', locale, t });
      setInitialState(state);
    };

    awaitInitialState();
  }, [fieldSchema, element.fields, user, locale, t, getDocPreferences]);

  return (
    <Drawer
      slug={drawerSlug}
      title={t('general:editLabel', { label: getTranslation(relatedCollection.labels.singular, i18n) })}
    >
      <Form
        onSubmit={handleUpdateEditData}
        initialState={initialState}
      >
        <RenderFields
          readOnly={false}
          fieldTypes={fieldTypes}
          fieldSchema={fieldSchema}
        />
        <FormSubmit>
          {t('fields:saveChanges')}
        </FormSubmit>
      </Form>
    </Drawer>
  );
};
