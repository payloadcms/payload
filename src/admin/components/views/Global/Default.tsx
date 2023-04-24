import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import Eyebrow from '../../elements/Eyebrow';
import Form from '../../forms/Form';
import PreviewButton from '../../elements/PreviewButton';
import FormSubmit from '../../forms/Submit';
import RenderFields from '../../forms/RenderFields';
import CopyToClipboard from '../../elements/CopyToClipboard';
import Meta from '../../utilities/Meta';
import fieldTypes from '../../forms/field-types';
import LeaveWithoutSaving from '../../modals/LeaveWithoutSaving';
import VersionsCount from '../../elements/VersionsCount';
import { Props } from './types';
import ViewDescription from '../../elements/ViewDescription';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import SaveDraft from '../../elements/SaveDraft';
import Publish from '../../elements/Publish';
import Status from '../../elements/Status';
import Autosave from '../../elements/Autosave';
import { OperationContext } from '../../utilities/OperationProvider';
import { Gutter } from '../../elements/Gutter';
import { getTranslation } from '../../../../utilities/getTranslation';
import { FormLoadingOverlayToggle } from '../../elements/Loading';
import { formatDate } from '../../../utilities/formatDate';

import './index.scss';

const baseClass = 'global-edit';

const DefaultGlobalView: React.FC<Props> = (props) => {
  const {
    global, data, onSave, permissions, action, apiURL, initialState, isLoading, updatedAt,
  } = props;

  const { admin: { dateFormat } } = useConfig();
  const { publishedDoc } = useDocumentInfo();
  const { t, i18n } = useTranslation('general');

  const {
    fields,
    versions,
    label,
    admin: {
      description,
      hideAPIURL,
      preview,
    } = {},
  } = global;

  const hasSavePermission = permissions?.update?.permission;

  return (
    <div className={baseClass}>
      <OperationContext.Provider value="update">
        <Form
          className={`${baseClass}__form`}
          method="post"
          action={action}
          onSuccess={onSave}
          disabled={!hasSavePermission}
          initialState={initialState}
        >
          <FormLoadingOverlayToggle
            action="update"
            name={`global-edit--${label}`}
            loadingSuffix={getTranslation(label, i18n)}
          />

          {!isLoading && (
            <React.Fragment>
              <div className={`${baseClass}__main`}>
                <Meta
                  title={getTranslation(label, i18n)}
                  description={getTranslation(label, i18n)}
                  keywords={`${getTranslation(label, i18n)}, Payload, CMS`}
                />
                <Eyebrow />
                {!(global.versions?.drafts && global.versions?.drafts?.autosave) && (
                  <LeaveWithoutSaving />
                )}
                <Gutter className={`${baseClass}__edit`}>
                  <header className={`${baseClass}__header`}>
                    <h1>
                      {t('editLabel', { label: getTranslation(label, i18n) })}
                    </h1>
                    {description && (
                      <div className={`${baseClass}__sub-header`}>
                        <ViewDescription description={description} />
                      </div>
                    )}
                  </header>
                  <RenderFields
                    readOnly={!hasSavePermission}
                    permissions={permissions.fields}
                    filter={(field) => (!field.admin.position || (field.admin.position && field.admin.position !== 'sidebar'))}
                    fieldTypes={fieldTypes}
                    fieldSchema={fields}
                  />
                </Gutter>
              </div>
              <div className={`${baseClass}__sidebar-wrap`}>
                <div className={`${baseClass}__sidebar`}>
                  <div className={`${baseClass}__sidebar-sticky-wrap`}>
                    <div className={`${baseClass}__document-actions${((global.versions?.drafts && !global.versions?.drafts?.autosave) || preview) ? ` ${baseClass}__document-actions--has-2` : ''}`}>
                      {(preview && (!global.versions?.drafts || global.versions?.drafts?.autosave)) && (
                        <PreviewButton
                          generatePreviewURL={preview}
                        />
                      )}
                      {hasSavePermission && (
                        <React.Fragment>
                          {global.versions?.drafts && (
                            <React.Fragment>
                              {!global.versions.drafts.autosave && (
                                <SaveDraft />
                              )}
                              <Publish />
                            </React.Fragment>
                          )}
                          {!global.versions?.drafts && (
                            <FormSubmit buttonId="action-save">{t('save')}</FormSubmit>
                          )}
                        </React.Fragment>
                      )}
                    </div>
                    <div className={`${baseClass}__sidebar-fields`}>
                      {(preview && (global.versions?.drafts && !global.versions?.drafts?.autosave)) && (
                        <PreviewButton
                          generatePreviewURL={preview}
                        />
                      )}
                      {global.versions?.drafts && (
                        <React.Fragment>
                          <Status />
                          {(global.versions.drafts.autosave && hasSavePermission) && (
                            <Autosave
                              publishedDocUpdatedAt={publishedDoc?.updatedAt || data?.createdAt}
                              global={global}
                            />
                          )}
                        </React.Fragment>
                      )}
                      <RenderFields
                        readOnly={!hasSavePermission}
                        permissions={permissions.fields}
                        filter={(field) => field.admin.position === 'sidebar'}
                        fieldTypes={fieldTypes}
                        fieldSchema={fields}
                      />
                    </div>
                    <ul className={`${baseClass}__meta`}>
                      {versions && (
                        <li>
                          <div className={`${baseClass}__label`}>{t('version:versions')}</div>
                          <VersionsCount global={global} />
                        </li>
                      )}
                      {(data && !hideAPIURL) && (
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
                      )}
                      {updatedAt && (
                        <li>
                          <div className={`${baseClass}__label`}>{t('lastModified')}</div>
                          <div>{formatDate((updatedAt as string), dateFormat, i18n?.language)}</div>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </React.Fragment>
          )}
        </Form>
      </OperationContext.Provider>
    </div>
  );
};

export default DefaultGlobalView;
