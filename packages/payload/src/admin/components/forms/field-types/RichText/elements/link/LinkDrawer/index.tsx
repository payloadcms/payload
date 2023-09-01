import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { Props } from './types';

import fieldTypes from '../../../..';
import useHotkey from '../../../../../../../hooks/useHotkey';
import { Drawer } from '../../../../../../elements/Drawer';
import { useEditDepth } from '../../../../../../utilities/EditDepth';
import Form from '../../../../../Form';
import RenderFields from '../../../../../RenderFields';
import FormSubmit from '../../../../../Submit';
import './index.scss';

const baseClass = 'rich-text-link-edit-modal';

export const LinkDrawer: React.FC<Props> = ({
  drawerSlug,
  fieldSchema,
  handleModalSubmit,
  initialState,
}) => {
  const { t } = useTranslation('fields');

  return (
    <Drawer
      className={baseClass}
      slug={drawerSlug}
      title={t('editLink')}
    >
      <Form
        initialState={initialState}
        onSubmit={handleModalSubmit}
      >
        <RenderFields
          fieldSchema={fieldSchema}
          fieldTypes={fieldTypes}
          forceRender
          readOnly={false}
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

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
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
