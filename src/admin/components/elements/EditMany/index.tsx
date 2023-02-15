import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '@faceless-ui/modal';
import { useConfig } from '../../utilities/Config';
import { Drawer, DrawerToggler } from '../Drawer';
import { Props } from './types';
import { SelectAllStatus, useSelection } from '../../views/collections/List/SelectionProvider';
import { getTranslation } from '../../../../utilities/getTranslation';
import { useAuth } from '../../utilities/Auth';
import { Index } from '../FieldSelect';
import FormSubmit from '../../forms/Submit';
import Form from '../../forms/Form';
import RenderFields from '../../forms/RenderFields';
import { OperationContext } from '../../utilities/OperationProvider';
import fieldTypes from '../../forms/field-types';

import './index.scss';

const baseClass = 'edit-many';

const EditMany: React.FC<Props> = (props) => {
  const {
    resetParams,
    collection,
    collection: {
      slug,
      labels: {
        plural,
      },
    } = {},
  } = props;

  const { permissions } = useAuth();
  const { serverURL, routes: { api } } = useConfig();
  const { closeModal } = useModal();
  const { selectAll, count, getQueryParams } = useSelection();
  const { t, i18n } = useTranslation('general');
  const [selected, setSelected] = useState([]);

  const collectionPermissions = permissions?.collections?.[slug];
  const hasUpdatePermission = collectionPermissions?.update?.permission;

  const drawerSlug = `edit-${slug}`;

  if (selectAll === SelectAllStatus.None || !hasUpdatePermission) {
    return null;
  }

  const onSuccess = () => {
    resetParams({ page: selectAll ? 1 : undefined });
    setSelected([]);
    closeModal(drawerSlug);
  };

  return (
    <div className={baseClass}>
      <DrawerToggler
        slug={drawerSlug}
        className={[
          `${baseClass}__toggle`,
          // TODO: improve
          'pill',
          'pill--style-light',
          'pill--has-action',
        ].join(' ')}
        aria-label={t('edit')}
        onClick={() => {
          setSelected([]);
        }}
      >
        {t('edit')}
      </DrawerToggler>
      <Drawer
        slug={drawerSlug}
        title={t('editingLabel', { label: getTranslation(plural, i18n), count })}
      >
        <OperationContext.Provider value="update">
          <Form
            onSuccess={onSuccess}
            action={`${serverURL}${api}/${slug}${getQueryParams()}`}
            method="patch"
            disabled={selected.length === 0}
          >
            <Index
              fields={collection.fields}
              setSelected={setSelected}
            />
            <RenderFields
              fieldTypes={fieldTypes}
              fieldSchema={selected}
            />
            {/* TODO: move save button to sidebar */}
            <FormSubmit>
              {t('save')}
            </FormSubmit>
          </Form>
        </OperationContext.Provider>
      </Drawer>
    </div>
  );
};

export default EditMany;
