import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../../../../elements/Drawer/index.js';
import Form from '../../../../../Form/index.js';
import FormSubmit from '../../../../../Submit/index.js';
import { Props } from './types.js';
import fieldTypes from '../../../../index.js';
import RenderFields from '../../../../../RenderFields/index.js';
import useHotkey from '../../../../../../../hooks/useHotkey.js';
import { useEditDepth } from '../../../../../../utilities/EditDepth/index.js';

import './index.scss';

const baseClass = 'rich-text-link-edit-modal';

export const LinkDrawer: React.FC<Props> = ({
  handleModalSubmit,
  initialState,
  fieldSchema,
  drawerSlug,
}) => {
  const { t } = useTranslation('fields');

  return (
    <Drawer
      slug={drawerSlug}
      className={baseClass}
      title={t('editLink')}
    >
      <Form
        onSubmit={handleModalSubmit}
        initialState={initialState}
      >
        <RenderFields
          fieldTypes={fieldTypes}
          readOnly={false}
          fieldSchema={fieldSchema}
          forceRender
        />
        <LinkSubmit />
      </Form>
    </Drawer>
  );
};


const LinkSubmit: React.FC = () => {
  const { t } = useTranslation('fields');
  const ref = useRef<HTMLButtonElement>(null);
  const editDepth = useEditDepth();

  useHotkey({ keyCodes: ['s'], cmdCtrlKey: true, editDepth }, (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (ref?.current) {
      ref.current.click();
    }
  });


  return (
    <FormSubmit
      ref={ref}
    >
      {t('general:submit')}
    </FormSubmit>
  );
};
