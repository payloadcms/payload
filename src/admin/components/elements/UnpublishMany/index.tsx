import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import Button from '../Button';
import MinimalTemplate from '../../templates/Minimal';
import { requests } from '../../../api';
import { Props } from './types';
import { SelectAllStatus, useSelection } from '../../views/collections/List/SelectionProvider';
import { getTranslation } from '../../../../utilities/getTranslation';
import Pill from '../Pill';
import { useAuth } from '../../utilities/Auth';

import './index.scss';

const baseClass = 'unpublish-many';

const UnpublishMany: React.FC<Props> = (props) => {
  const {
    resetParams,
    collection: {
      slug,
      labels: {
        plural,
      },
      versions,
    } = {},
  } = props;

  const { serverURL, routes: { api } } = useConfig();
  const { permissions } = useAuth();
  const { toggleModal } = useModal();
  const { t, i18n } = useTranslation('version');
  const { selectAll, count, getQueryParams } = useSelection();
  const [submitted, setSubmitted] = useState(false);

  const collectionPermissions = permissions?.collections?.[slug];
  const hasPermission = collectionPermissions?.update?.permission;

  const modalSlug = `unpublish-${slug}`;

  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'));
  }, [t]);

  const handleUnpublish = useCallback(() => {
    setSubmitted(true);
    requests.patch(`${serverURL}${api}/${slug}${getQueryParams({ _status: { not_equals: 'draft' } })}`, {
      body: JSON.stringify({
        _status: 'draft',
      }),
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': i18n.language,
      },
    }).then(async (res) => {
      try {
        const json = await res.json();
        toggleModal(modalSlug);
        if (res.status < 400) {
          toast.success(t('general:updatedSuccessfully'));
          resetParams({ page: selectAll ? 1 : undefined });
          return null;
        }

        if (json.errors) {
          json.errors.forEach((error) => toast.error(error.message));
        } else {
          addDefaultError();
        }
        return false;
      } catch (e) {
        return addDefaultError();
      }
    });
  }, [addDefaultError, api, getQueryParams, i18n.language, modalSlug, resetParams, selectAll, serverURL, slug, t, toggleModal]);

  if (!(versions?.drafts) || (selectAll === SelectAllStatus.None || !hasPermission)) {
    return null;
  }

  return (
    <React.Fragment>
      <Pill
        className={`${baseClass}__toggle`}
        onClick={() => {
          setSubmitted(false);
          toggleModal(modalSlug);
        }}
      >
        {t('unpublish')}
      </Pill>
      <Modal
        slug={modalSlug}
        className={baseClass}
      >
        <MinimalTemplate className={`${baseClass}__template`}>
          <h1>{t('confirmUnpublish')}</h1>
          <p>
            {t('aboutToUnpublishSelection', { label: getTranslation(plural, i18n) })}
          </p>
          <Button
            id="confirm-cancel"
            buttonStyle="secondary"
            type="button"
            onClick={submitted ? undefined : () => toggleModal(modalSlug)}
          >
            {t('general:cancel')}
          </Button>
          <Button
            onClick={submitted ? undefined : handleUnpublish}
            id="confirm-unpublish"
          >
            {submitted ? t('unpublishing') : t('general:confirm')}
          </Button>
        </MinimalTemplate>
      </Modal>
    </React.Fragment>
  );
};

export default UnpublishMany;
