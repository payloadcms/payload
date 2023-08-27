import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config.js';
import Eyebrow from '../../elements/Eyebrow.js';
import Form from '../../forms/Form.js';
import PreviewButton from '../../elements/PreviewButton.js';
import { Save } from '../../elements/Save.js';
import RenderFields from '../../forms/RenderFields.js';
import CopyToClipboard from '../../elements/CopyToClipboard.js';
import fieldTypes from '../../forms/field-types.js';
import RenderTitle from '../../elements/RenderTitle.js';
import LeaveWithoutSaving from '../../modals/LeaveWithoutSaving.js';
import Meta from '../../utilities/Meta.js';
import Auth from '../collections/Edit/Auth.js';
import { Props } from './types.js';
import { OperationContext } from '../../utilities/OperationProvider.js';
import { ToggleTheme } from './ToggleTheme.js';
import { Gutter } from '../../elements/Gutter.js';
import ReactSelect from '../../elements/ReactSelect.js';
import Label from '../../forms/Label.js';
import type { Translation } from '../../../../translations/type.js';
import { LoadingOverlayToggle } from '../../elements/Loading.js';
import { formatDate } from '../../../utilities/formatDate.js';
import { useAuth } from '../../utilities/Auth.js';

import './index.scss';

const baseClass = 'account';

const DefaultAccount: React.FC<Props> = (props) => {
  const {
    collection,
    data,
    permissions,
    hasSavePermission,
    apiURL,
    initialState,
    isLoading,
    action,
    onSave: onSaveFromProps,
  } = props;

  const {
    slug,
    fields,
    admin: {
      useAsTitle,
      preview,
    },
    timestamps,
    auth,
  } = collection;

  const { refreshCookieAsync } = useAuth();
  const { admin: { dateFormat }, routes: { admin } } = useConfig();
  const { t, i18n } = useTranslation('authentication');

  const languageOptions = Object.entries(i18n.options.resources).map(([language, resource]) => (
    { label: (resource as Translation).general.thisLanguage, value: language }
  ));

  const onSave = useCallback(async () => {
    await refreshCookieAsync();
    if (typeof onSaveFromProps === 'function') {
      onSaveFromProps();
    }
  }, [onSaveFromProps, refreshCookieAsync]);

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <React.Fragment>
      <LoadingOverlayToggle
        name="account"
        show={isLoading}
        type="withoutNav"
      />
      <div className={classes}>
        {!isLoading && (
          <OperationContext.Provider value="update">
            <Form
              className={`${baseClass}__form`}
              method="patch"
              action={action}
              onSuccess={onSave}
              initialState={initialState}
              disabled={!hasSavePermission}
            >
              <div className={`${baseClass}__main`}>
                <Meta
                  title={t('account')}
                  description={t('accountOfCurrentUser')}
                  keywords={t('account')}
                />
                <Eyebrow />
                {!(collection.versions?.drafts && collection.versions?.drafts?.autosave) && (
                  <LeaveWithoutSaving />
                )}
                <div className={`${baseClass}__edit`}>
                  <Gutter className={`${baseClass}__header`}>
                    <h1>
                      <RenderTitle
                        data={data}
                        collection={collection}
                        useAsTitle={useAsTitle}
                        fallback={`[${t('general:untitled')}]`}
                      />
                    </h1>
                    <Auth
                      useAPIKey={auth.useAPIKey}
                      collection={collection}
                      email={data?.email}
                      operation="update"
                      readOnly={!hasSavePermission}
                    />
                    <RenderFields
                      permissions={permissions.fields}
                      readOnly={!hasSavePermission}
                      filter={(field) => field?.admin?.position !== 'sidebar'}
                      fieldTypes={fieldTypes}
                      fieldSchema={fields}
                    />
                  </Gutter>
                  <Gutter
                    className={`${baseClass}__payload-settings`}
                  >
                    <h3>{t('general:payloadSettings')}</h3>
                    <div className={`${baseClass}__language`}>
                      <Label
                        htmlFor="language-select"
                        label={t('general:language')}
                      />
                      <ReactSelect
                        inputId="language-select"
                        value={languageOptions.find((language) => (language.value === i18n.language))}
                        options={languageOptions}
                        onChange={({ value }) => (i18n.changeLanguage(value))}
                      />
                    </div>
                    <ToggleTheme />
                  </Gutter>
                </div>
              </div>
              <div className={`${baseClass}__sidebar-wrap`}>
                <div className={`${baseClass}__sidebar`}>
                  <div className={`${baseClass}__sidebar-sticky-wrap`}>
                    <ul className={`${baseClass}__collection-actions`}>
                      {(permissions?.create?.permission) && (
                        <React.Fragment>
                          <li><Link to={`${admin}/collections/${slug}/create`}>{t('general:createNew')}</Link></li>
                        </React.Fragment>
                      )}
                    </ul>
                    <div className={`${baseClass}__document-actions${preview ? ` ${baseClass}__document-actions--with-preview` : ''}`}>
                      {(preview && (!collection.versions?.drafts || collection.versions?.drafts?.autosave)) && (
                        <PreviewButton
                          generatePreviewURL={preview}
                          CustomComponent={collection?.admin?.components?.edit?.PreviewButton}
                        />
                      )}
                      {hasSavePermission && (
                        <Save
                          CustomComponent={collection?.admin?.components?.edit?.SaveButton}
                        />
                      )}
                    </div>
                    <div className={`${baseClass}__sidebar-fields`}>
                      <RenderFields
                        permissions={permissions.fields}
                        readOnly={!hasSavePermission}
                        filter={(field) => field?.admin?.position === 'sidebar'}
                        fieldTypes={fieldTypes}
                        fieldSchema={fields}
                      />
                    </div>
                    <ul className={`${baseClass}__meta`}>
                      <li className={`${baseClass}__api-url`}>
                        <span className={`${baseClass}__label`}>
                          API URL
                          {' '}
                          <CopyToClipboard value={apiURL} />
                        </span>
                        <a
                          href={apiURL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {apiURL}
                        </a>
                      </li>
                      <li>
                        <div className={`${baseClass}__label`}>ID</div>
                        <div>{data?.id}</div>
                      </li>
                      {timestamps && (
                        <React.Fragment>
                          {data.updatedAt && (
                            <li>
                              <div className={`${baseClass}__label`}>{t('general:lastModified')}</div>
                              <div>{formatDate(data.updatedAt, dateFormat, i18n?.language)}</div>
                            </li>
                          )}
                          {data.createdAt && (
                            <li>
                              <div className={`${baseClass}__label`}>{t('general:created')}</div>
                              <div>{formatDate(data.createdAt, dateFormat, i18n?.language)}</div>
                            </li>
                          )}
                        </React.Fragment>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </Form>
          </OperationContext.Provider>
        )}
      </div>
    </React.Fragment>
  );
};

export default DefaultAccount;
