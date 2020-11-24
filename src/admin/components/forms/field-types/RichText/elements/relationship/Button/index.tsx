import React, { Fragment, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { useSlate } from 'slate-react';
import { useConfig } from '@payloadcms/config-provider';
import ElementButton from '../../Button';
import RelationshipIcon from '../../../../../../icons/Relationship';
import Form from '../../../../../Form';
import MinimalTemplate from '../../../../../../templates/Minimal';
import Button from '../../../../../../elements/Button';
import Submit from '../../../../../Submit';
import X from '../../../../../../icons/X';
import Fields from './Fields';
import { requests } from '../../../../../../../api';

import './index.scss';

const initialFormData = {
  depth: 0,
};

const baseClass = 'relationship-rich-text-button';

const insertRelationship = (editor, { value, relationTo, depth }) => {
  const text = { text: ' ' };

  const relationship = {
    type: 'relationship',
    value,
    depth,
    relationTo,
    children: [
      text,
    ],
  };

  const nodes = [relationship, { children: [{ text: '' }] }];

  Transforms.insertNodes(editor, nodes);
};

const RelationshipButton = ({ path }) => {
  const { open, closeAll } = useModal();
  const editor = useSlate();
  const { serverURL, routes: { api }, collections } = useConfig();
  const [loading, setLoading] = useState(false);
  const [hasEnabledCollections] = useState(() => collections.find(({ admin: { enableRichTextRelationship } }) => enableRichTextRelationship));

  const handleAddRelationship = useCallback(async (_, { relationTo, value, depth }) => {
    setLoading(true);

    const res = await requests.get(`${serverURL}${api}/${relationTo}/${value}?depth=${depth}`);
    const json = await res.json();

    insertRelationship(editor, { value: json, depth, relationTo });
    closeAll();
  }, [editor, closeAll, api, serverURL]);

  const modalSlug = `${path}-add-relationship`;

  if (!hasEnabledCollections) return null;

  return (
    <Fragment>
      <ElementButton
        className={baseClass}
        format="relationship"
        onClick={() => open(modalSlug)}
      >
        <RelationshipIcon />
      </ElementButton>
      <Modal
        slug={modalSlug}
        className={`${baseClass}__modal`}
      >
        <MinimalTemplate>
          <header className={`${baseClass}__header`}>
            <h3>Add Relationship</h3>
            <Button
              buttonStyle="none"
              onClick={closeAll}
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
              Add relationship
            </Submit>
          </Form>
        </MinimalTemplate>
      </Modal>
    </Fragment>
  );
};

RelationshipButton.propTypes = {
  path: PropTypes.string.isRequired,
};

export default RelationshipButton;
