import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { ReactEditor, useSlate } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../../../utilities/Config';
import ElementButton from '../../Button';
import RelationshipIcon from '../../../../../../icons/Relationship';
import Form from '../../../../../Form';
import MinimalTemplate from '../../../../../../templates/Minimal';
import Button from '../../../../../../elements/Button';
import Submit from '../../../../../Submit';
import X from '../../../../../../icons/X';
import Fields from './Fields';
import { requests } from '../../../../../../../api';
import { injectVoidElement } from '../../injectVoid';

import './index.scss';

const initialFormData = {};

const baseClass = 'relationship-rich-text-button';

const insertRelationship = (editor, { value, relationTo }) => {
  const text = { text: ' ' };

  const relationship = {
    type: 'relationship',
    value,
    relationTo,
    children: [
      text,
    ],
  };

  injectVoidElement(editor, relationship);

  ReactEditor.focus(editor);
};

const RelationshipButton: React.FC<{ path: string }> = ({ path }) => {
  const { toggleModal } = useModal();
  const editor = useSlate();
  const { serverURL, routes: { api }, collections } = useConfig();
  const [renderModal, setRenderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation('fields');
  const [hasEnabledCollections] = useState(() => collections.find(({ admin: { enableRichTextRelationship } }) => enableRichTextRelationship));
  const modalSlug = `${path}-add-relationship`;

  const handleAddRelationship = useCallback(async (_, { relationTo, value }) => {
    setLoading(true);

    const res = await requests.get(`${serverURL}${api}/${relationTo}/${value}?depth=0`, {
      headers: {
        'Accept-Language': i18n.language,
      },
    });
    const json = await res.json();

    insertRelationship(editor, { value: { id: json.id }, relationTo });
    toggleModal(modalSlug);
    setRenderModal(false);
    setLoading(false);
  }, [i18n.language, editor, toggleModal, modalSlug, api, serverURL]);

  useEffect(() => {
    if (renderModal) {
      toggleModal(modalSlug);
    }
  }, [renderModal, toggleModal, modalSlug]);

  if (!hasEnabledCollections) return null;

  return (
    <Fragment>
      <ElementButton
        className={baseClass}
        format="relationship"
        onClick={() => setRenderModal(true)}
      >
        <RelationshipIcon />
      </ElementButton>
      {renderModal && (
        <Modal
          slug={modalSlug}
          className={`${baseClass}__modal`}
        >
          <MinimalTemplate className={`${baseClass}__modal-template`}>
            <header className={`${baseClass}__header`}>
              <h3>{t('addRelationship')}</h3>
              <Button
                buttonStyle="none"
                onClick={() => {
                  toggleModal(modalSlug);
                  setRenderModal(false);
                }}
              >
                <X />
              </Button>
            </header>
            <Form
              onSubmit={handleAddRelationship}
              initialData={initialFormData}
              disabled={loading}
            >
              <Fields />
              <Submit>
                {t('addRelationship')}
              </Submit>
            </Form>
          </MinimalTemplate>
        </Modal>
      )}
    </Fragment>
  );
};

export default RelationshipButton;
