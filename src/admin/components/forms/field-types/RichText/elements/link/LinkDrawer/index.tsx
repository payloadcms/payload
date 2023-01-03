import React from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../../../../elements/Drawer';
import Button from '../../../../../../elements/Button';
import X from '../../../../../../icons/X';
import Form from '../../../../../Form';
import FormSubmit from '../../../../../Submit';
import { Props } from './types';
import fieldTypes from '../../../..';
import RenderFields from '../../../../../RenderFields';

import './index.scss';
import { Gutter } from '../../../../../../elements/Gutter';

const baseClass = 'rich-text-link-edit-modal';

export const LinkDrawer: React.FC<Props> = ({
  handleClose,
  handleModalSubmit,
  initialState,
  fieldSchema,
  drawerSlug,
}) => {
  const { t } = useTranslation('fields');

  return (
    <Drawer
      slug={drawerSlug}
      formatSlug={false}
      className={baseClass}
    >
      <Gutter className={`${baseClass}__template`}>
        <header className={`${baseClass}__header`}>
          <h2 className={`${baseClass}__header-text`}>
            {t('editLink')}
          </h2>
          <Button
            className={`${baseClass}__header-close`}
            buttonStyle="none"
            onClick={handleClose}
          >
            <X />
          </Button>
        </header>
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
      </Gutter>
    </Drawer>
  );
};
