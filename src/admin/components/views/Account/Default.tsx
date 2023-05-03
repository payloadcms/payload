import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import Eyebrow from '../../elements/Eyebrow';
import Form from '../../forms/Form';
import PreviewButton from '../../elements/PreviewButton';
import { Save } from '../../elements/Save';
import RenderFields from '../../forms/RenderFields';
import CopyToClipboard from '../../elements/CopyToClipboard';
import fieldTypes from '../../forms/field-types';
import RenderTitle from '../../elements/RenderTitle';
import LeaveWithoutSaving from '../../modals/LeaveWithoutSaving';
import Meta from '../../utilities/Meta';
import Auth from '../collections/Edit/Auth';
import { Props } from './types';
import { OperationContext } from '../../utilities/OperationProvider';
import { ToggleTheme } from './ToggleTheme';
import { Gutter } from '../../elements/Gutter';
import ReactSelect from '../../elements/ReactSelect';
import Label from '../../forms/Label';
import type { Translation } from '../../../../translations/type';
import { LoadingOverlayToggle } from '../../elements/Loading';
import { formatDate } from '../../../utilities/formatDate';

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
    onSave,
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

  const { admin: { dateFormat }, routes: { admin } } = useConfig();
  const { t, i18n } = useTranslation('authentication');

  const languageOptions = Object.entries(i18n.options.resources).map(([language, resource]) => (
    { label: (resource as Translation).general.thisLanguage, value: language }
  ));

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
                        label={t('general:language')}
                      />
                      <ReactSelect
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
                          CustomComponent={collection?.admin?.components?.elements?.PreviewButton}
                        />
                      )}
                      {hasSavePermission && (
                        <Save
                          CustomComponent={collection?.admin?.components?.elements?.SaveButton}
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
