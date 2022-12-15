import React, { Fragment, useCallback, useId, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
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
import { Drawer, formatDrawerSlug } from '../../../../../../elements/Drawer';
import { useEditDepth } from '../../../../../../utilities/EditDepth';
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
  const { openModal, closeModal } = useModal();
  const editor = useSlate();
  const { serverURL, routes: { api }, collections } = useConfig();
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation('fields');
  const [hasEnabledCollections] = useState(() => collections.find(({ admin: { enableRichTextRelationship } }) => enableRichTextRelationship));
  const editDepth = useEditDepth();
  const uuid = useId();
  const drawerSlug = formatDrawerSlug({
    slug: `${path}-add-relationship-${uuid}`,
    depth: editDepth,
  });

  const handleAddRelationship = useCallback(async (_, { relationTo, value }) => {
    setLoading(true);

    const res = await requests.get(`${serverURL}${api}/${relationTo}/${value}?depth=0`, {
      headers: {
        'Accept-Language': i18n.language,
      },
    });
    const json = await res.json();

    insertRelationship(editor, { value: { id: json.id }, relationTo });
    closeModal(drawerSlug);
    setLoading(false);
  }, [i18n.language, editor, closeModal, drawerSlug, api, serverURL]);

  if (!hasEnabledCollections) return null;

  return (
    <Fragment>
      <ElementButton
        className={baseClass}
        format="relationship"
        onClick={() => openModal(drawerSlug)}
        tooltip={t('addRelationship')}
      >
        <RelationshipIcon />
      </ElementButton>
      <Drawer
        slug={drawerSlug}
        formatSlug={false}
        className={`${baseClass}__modal`}
      >
        <MinimalTemplate className={`${baseClass}__modal-template`}>
          <header className={`${baseClass}__header`}>
            <h3>{t('addRelationship')}</h3>
            <Button
              buttonStyle="none"
              onClick={() => {
                openModal(drawerSlug);
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
      </Drawer>
    </Fragment>
  );
};

export default RelationshipButton;
