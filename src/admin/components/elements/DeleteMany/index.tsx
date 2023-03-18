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

const baseClass = 'delete-documents';

const DeleteMany: React.FC<Props> = (props) => {
  const {
    resetParams,
    collection: {
      slug,
      labels: {
        plural,
      },
    } = {},
  } = props;

  const { permissions } = useAuth();
  const { serverURL, routes: { api } } = useConfig();
  const { toggleModal } = useModal();
  const { selectAll, count, getQueryParams, toggleAll } = useSelection();
  const { t, i18n } = useTranslation('general');
  const [deleting, setDeleting] = useState(false);

  const collectionPermissions = permissions?.collections?.[slug];
  const hasDeletePermission = collectionPermissions?.delete?.permission;

  const modalSlug = `delete-${slug}`;

  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'));
  }, [t]);

  const handleDelete = useCallback(() => {
    setDeleting(true);
    requests.delete(`${serverURL}${api}/${slug}${getQueryParams()}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': i18n.language,
      },
    }).then(async (res) => {
      try {
        const json = await res.json();
        toggleModal(modalSlug);
        if (res.status < 400) {
          toast.success(json.message || t('deletedSuccessfully'), { autoClose: 3000 });
          toggleAll();
          resetParams({ page: selectAll ? 1 : undefined });
          return null;
        }

        if (json.errors) {
          toast.error(json.message);
        } else {
          addDefaultError();
        }
        return false;
      } catch (e) {
        return addDefaultError();
      }
    });
  }, [addDefaultError, api, getQueryParams, i18n.language, modalSlug, resetParams, selectAll, serverURL, slug, t, toggleAll, toggleModal]);

  if (selectAll === SelectAllStatus.None || !hasDeletePermission) {
    return null;
  }

  return (
    <React.Fragment>
      <Pill
        className={`${baseClass}__toggle`}
        onClick={() => {
          setDeleting(false);
          toggleModal(modalSlug);
        }}
      >
        {t('delete')}
      </Pill>
      <Modal
        slug={modalSlug}
        className={baseClass}
      >
        <MinimalTemplate className={`${baseClass}__template`}>
          <h1>{t('confirmDeletion')}</h1>
          <p>
            {t('aboutToDeleteCount', { label: getTranslation(plural, i18n), count })}
          </p>
          <Button
            id="confirm-cancel"
            buttonStyle="secondary"
            type="button"
            onClick={deleting ? undefined : () => toggleModal(modalSlug)}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={deleting ? undefined : handleDelete}
            id="confirm-delete"
          >
            {deleting ? t('deleting') : t('confirm')}
          </Button>
        </MinimalTemplate>
      </Modal>
    </React.Fragment>
  );
};

export default DeleteMany;
