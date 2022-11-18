import React, { useEffect, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useWindowInfo } from '@faceless-ui/window-info';
import { useTranslation } from 'react-i18next';
import Button from '../../../../../elements/Button';
import { Props } from './types';
import { useAuth } from '../../../../../utilities/Auth';
import RenderCustomComponent from '../../../../../utilities/RenderCustomComponent';
import { useLocale } from '../../../../../utilities/Locale';
import { useConfig } from '../../../../../utilities/Config';
import DefaultEdit from '../../../../../views/collections/Edit/Default';
import X from '../../../../../icons/X';
import { Fields } from '../../../../Form/types';
import buildStateFromSchema from '../../../../Form/buildStateFromSchema';
import { EditDepthContext, useEditDepth } from '../../../../../utilities/EditDepth';
import { getTranslation } from '../../../../../../../utilities/getTranslation';
import { DocumentInfoProvider } from '../../../../../utilities/DocumentInfo';

import './index.scss';

const baseClass = 'relationship-add-new-modal';

export const AddNewRelationModal: React.FC<Props> = ({ modalCollection, onSave, modalSlug }) => {
  const { serverURL, routes: { api } } = useConfig();
  const { toggleModal } = useModal();
  const { breakpoints: { m: midBreak } } = useWindowInfo();
  const locale = useLocale();
  const { permissions, user } = useAuth();
  const [initialState, setInitialState] = useState<Fields>();
  const [isAnimated, setIsAnimated] = useState(false);
  const editDepth = useEditDepth();
  const { t, i18n } = useTranslation('fields');

  const modalAction = `${serverURL}${api}/${modalCollection.slug}?locale=${locale}&depth=0&fallback-locale=null`;

  useEffect(() => {
    const buildState = async () => {
      const state = await buildStateFromSchema({ fieldSchema: modalCollection.fields, data: {}, user, operation: 'create', locale, t });
      setInitialState(state);
    };

    buildState();
  }, [modalCollection, locale, user, t]);

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  return (
    <Modal
      slug={modalSlug}
      className={[
        baseClass,
        isAnimated && `${baseClass}--animated`,
      ].filter(Boolean).join(' ')}
    >
      {editDepth === 1 && (
        <div className={`${baseClass}__blur-bg`} />
      )}
      <DocumentInfoProvider collection={modalCollection}>
        <EditDepthContext.Provider value={editDepth + 1}>
          <button
            className={`${baseClass}__close`}
            type="button"
            onClick={() => toggleModal(modalSlug)}
            style={{
              width: `calc(${midBreak ? 'var(--gutter-h)' : 'var(--nav-width)'} + ${editDepth - 1} * 25px)`,
            }}
          >
            <span>
              Close
            </span>
          </button>
          <RenderCustomComponent
            DefaultComponent={DefaultEdit}
            CustomComponent={modalCollection.admin?.components?.views?.Edit}
            componentProps={{
              isLoading: !initialState,
              data: {},
              collection: modalCollection,
              permissions: permissions.collections[modalCollection.slug],
              isEditing: false,
              onSave,
              initialState,
              hasSavePermission: true,
              action: modalAction,
              disableEyebrow: true,
              disableActions: true,
              disableLeaveWithoutSaving: true,
              customHeader: (
                <div className={`${baseClass}__header`}>
                  <h2>
                    {t('addNewLabel', { label: getTranslation(modalCollection.labels.singular, i18n) })}
                  </h2>
                  <Button
                    buttonStyle="none"
                    className={`${baseClass}__header-close`}
                    onClick={() => toggleModal(modalSlug)}
                  >
                    <X />
                  </Button>
                </div>
              ),
            }}
          />
        </EditDepthContext.Provider>
      </DocumentInfoProvider>
    </Modal>
  );
};
