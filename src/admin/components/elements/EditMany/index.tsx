import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '@faceless-ui/modal';
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
import X from '../../icons/X';

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
      className={`${baseClass}__save`}
      onClick={save}
      disabled={disabled}
    >
      {t('save')}
    </FormSubmit>
  );
};
const Publish: React.FC<{disabled: boolean, action: string}> = ({ action, disabled }) => {
  const { submit } = useForm();
  const { t } = useTranslation('version');

  const save = useCallback(() => {
    submit({
      skipValidation: true,
      method: 'PATCH',
      overrides: {
        _status: 'published',
      },
      action,
    });
  }, [action, submit]);

  return (
    <FormSubmit
      className={`${baseClass}__publish`}
      onClick={save}
      disabled={disabled}
    >
      {t('publishChanges')}
    </FormSubmit>
  );
};
const SaveDraft: React.FC<{disabled: boolean, action: string}> = ({ action, disabled }) => {
  const { submit } = useForm();
  const { t } = useTranslation('version');

  const save = useCallback(() => {
    submit({
      skipValidation: true,
      method: 'PATCH',
      overrides: {
        _status: 'draft',
      },
      action,
    });
  }, [action, submit]);

  return (
    <FormSubmit
      className={`${baseClass}__draft`}
      onClick={save}
      disabled={disabled}
    >
      {t('saveDraft')}
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
      fields,
    } = {},
  } = props;

  const { permissions } = useAuth();
  const { closeModal } = useModal();
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
        className={`${baseClass}__toggle`}
        aria-label={t('edit')}
        onClick={() => {
          setSelected([]);
        }}
      >
        {t('edit')}
      </DrawerToggler>
      <Drawer
        slug={drawerSlug}
        header={null}
      >
        <OperationContext.Provider value="update">
          <Form
            className={`${baseClass}__form`}
            onSuccess={onSuccess}
          >
            <div className={`${baseClass}__main`}>
              <div className={`${baseClass}__header`}>
                <h2 className={`${baseClass}__header__title`}>
                  {t('editingLabel', { label: getTranslation(plural, i18n), count })}
                </h2>
                <button
                  className={`${baseClass}__header__close`}
                  id={`close-drawer__${drawerSlug}`}
                  type="button"
                  onClick={() => closeModal(drawerSlug)}
                  aria-label={t('close')}
                >
                  <X />
                </button>
              </div>
              <FieldSelect
                fields={fields}
                setSelected={setSelected}
              />
              <RenderFields
                fieldTypes={fieldTypes}
                fieldSchema={selected}
              />
              <div className={`${baseClass}__sidebar-wrap`}>
                <div className={`${baseClass}__sidebar`}>
                  <div className={`${baseClass}__sidebar-sticky-wrap`}>
                    <div className={`${baseClass}__document-actions`}>
                      <Submit
                        action={`${serverURL}${api}/${slug}${getQueryParams()}`}
                        disabled={selected.length === 0}
                      />
                      { collection.versions && (
                        <React.Fragment>
                          <Publish
                            action={`${serverURL}${api}/${slug}${getQueryParams()}`}
                            disabled={selected.length === 0}
                          />
                          <SaveDraft
                            action={`${serverURL}${api}/${slug}${getQueryParams()}`}
                            disabled={selected.length === 0}
                          />
                        </React.Fragment>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </OperationContext.Provider>
      </Drawer>
    </div>
  );
};

export default EditMany;
