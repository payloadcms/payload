import React from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../../../../elements/Drawer';
import Form from '../../../../../Form';
import FormSubmit from '../../../../../Submit';
import { Props } from './types';
import fieldTypes from '../../../..';
import RenderFields from '../../../../../RenderFields';

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
        <FormSubmit>
          {t('general:submit')}
        </FormSubmit>
      </Form>
    </Drawer>
  );
};
