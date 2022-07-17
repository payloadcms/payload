import React, { useCallback, useEffect, useState } from 'react';
import { Transforms, Element } from 'slate';
import { ReactEditor, useSlateStatic } from 'slate-react';
import { Modal } from '@faceless-ui/modal';
import { useAuth } from '../../../../../../../utilities/Auth';
import { SanitizedCollectionConfig } from '../../../../../../../../../collections/config/types';
import buildStateFromSchema from '../../../../../../Form/buildStateFromSchema';
import MinimalTemplate from '../../../../../../../templates/Minimal';
import Button from '../../../../../../../elements/Button';
import RenderFields from '../../../../../../RenderFields';
import fieldTypes from '../../../../..';
import Form from '../../../../../../Form';
import reduceFieldsToValues from '../../../../../../Form/reduceFieldsToValues';
import Submit from '../../../../../../Submit';
import { Field } from '../../../../../../../../../fields/config/types';
import { useLocale } from '../../../../../../../utilities/Locale';

import './index.scss';

const baseClass = 'edit-upload-modal';

type Props = {
  slug: string
  closeModal: () => void
  relatedCollectionConfig: SanitizedCollectionConfig
  fieldSchema: Field[]
  element: Element & {
    fields: Field[]
  }
}
export const EditModal: React.FC<Props> = ({ slug, closeModal, relatedCollectionConfig, fieldSchema, element }) => {
  const editor = useSlateStatic();
  const [initialState, setInitialState] = useState({});
  const { user } = useAuth();
  const locale = useLocale();

  const handleUpdateEditData = useCallback((fields) => {
    const newNode = {
      fields: reduceFieldsToValues(fields, true),
    };

    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.setNodes(
      editor,
      newNode,
      { at: elementPath },
    );
    closeModal();
  }, [closeModal, editor, element]);

  useEffect(() => {
    const awaitInitialState = async () => {
      const state = await buildStateFromSchema({ fieldSchema, data: { ...element?.fields || {} }, user, operation: 'update', locale });
      setInitialState(state);
    };

    awaitInitialState();
  }, [fieldSchema, element.fields, user, locale]);

  return (
    <Modal
      slug={slug}
      className={baseClass}
    >
      <MinimalTemplate width="wide">
        <header className={`${baseClass}__header`}>
          <h1>
            Edit
            {' '}
            {relatedCollectionConfig.labels.singular}
            {' '}
            data
          </h1>
          <Button
            icon="x"
            round
            buttonStyle="icon-label"
            onClick={closeModal}
          />
        </header>

        <div>
          <Form
            onSubmit={handleUpdateEditData}
            initialState={initialState}
          >
            <RenderFields
              readOnly={false}
              fieldTypes={fieldTypes}
              fieldSchema={fieldSchema}
            />

            <Submit>
              Save changes
            </Submit>
          </Form>
        </div>
      </MinimalTemplate>
    </Modal>
  );
};
