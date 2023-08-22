import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../../../../elements/Drawer';
import Form from '../../../../../Form';
import FormSubmit from '../../../../../Submit';
import { Props } from './types';
import fieldTypes from '../../../..';
import RenderFields from '../../../../../RenderFields';
import useHotkey from '../../../../../../../hooks/useHotkey';
import { useEditDepth } from '../../../../../../utilities/EditDepth';

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
