import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import { Drawer, DrawerToggler } from '../Drawer';
import { Props } from './types';
import { SelectAllStatus, useSelection } from '../../views/collections/List/SelectionProvider';
import { getTranslation } from '../../../../utilities/getTranslation';
import { useAuth } from '../../utilities/Auth';
import { FieldSelect } from '../FieldSelect';
import FormSubmit from '../../forms/Submit';
import Form from '../../forms/Form';
import { useForm } from '../../forms/Form/context';
import RenderFields from '../../forms/RenderFields';
import { OperationContext } from '../../utilities/OperationProvider';
import fieldTypes from '../../forms/field-types';

import './index.scss';

const baseClass = 'edit-many';

const Submit: React.FC<{disabled: boolean, action: string}> = ({ action, disabled }) => {
  const { submit } = useForm();
  const { t } = useTranslation('general');

  const save = useCallback(() => {
    submit({
      skipValidation: true,
      method: 'PATCH',
      action,
    });
  }, [action, submit]);

  return (
    <FormSubmit
      onClick={save}
      disabled={disabled}
    >
      {t('save')}
    </FormSubmit>
  );
};
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
    resetParams({ page: selectAll === SelectAllStatus.AllAvailable ? 1 : undefined });
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
          >
            <FieldSelect
              fields={collection.fields}
              setSelected={setSelected}
            />
            <RenderFields
              fieldTypes={fieldTypes}
              fieldSchema={selected}
            />
            {/* TODO: move save button to sidebar */}
            <Submit
              action={`${serverURL}${api}/${slug}${getQueryParams()}`}
              disabled={selected.length === 0}
            />
          </Form>
        </OperationContext.Provider>
      </Drawer>
    </div>
  );
};

export default EditMany;
