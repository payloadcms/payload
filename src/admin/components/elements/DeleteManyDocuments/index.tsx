import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import queryString from 'qs';
import { useConfig } from '../../utilities/Config';
import Button from '../Button';
import MinimalTemplate from '../../templates/Minimal';
import { requests } from '../../../api';
import { Props } from './types';
import { useSelection } from '../../views/collections/List/SelectionProvider';

import './index.scss';

const baseClass = 'delete-documents';

const DeleteManyDocuments: React.FC<Props> = (props) => {
  const {
    buttonId,
    resetParams,
    collection: {
      slug,
    } = {},
  } = props;

  const { serverURL, routes: { api, admin } } = useConfig();
  const [deleting, setDeleting] = useState(false);
  const { toggleModal } = useModal();
  const { t, i18n } = useTranslation('general');
  const { selected, selectAll } = useSelection();

  const modalSlug = `delete-${slug}`;

  const addDefaultError = useCallback(() => {
    toast.error(t('error:deletingTitle'));
  }, [t]);

  const handleDelete = useCallback(() => {
    setDeleting(true);

    const params = queryString.stringify({
      where: {
        id: {
          in: Object.keys(selected).filter((id) => selected[id]).map((id) => id),
        },
      },
    }, { addQueryPrefix: true });

    requests.delete(`${serverURL}${api}/${slug}${params}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': i18n.language,
      },
    }).then(async (res) => {
      try {
        const json = await res.json();
        toggleModal(modalSlug);
        if (res.status < 400) {
          // toast.success(t('titleDeleted', { label: getTranslation(plural, i18n), title }));
          toast.success('Deleted');
          resetParams({ page: 1 });
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
  }, [addDefaultError, api, i18n.language, modalSlug, resetParams, selected, serverURL, slug, toggleModal]);

  if (selectAll === false) {
    return null;
  }

  return (
    <React.Fragment>
      <button
        type="button"
        id={buttonId}
        className={`${baseClass}__toggle`}
        onClick={(e) => {
          e.preventDefault();
          setDeleting(false);
          toggleModal(modalSlug);
        }}
      >
        {t('delete')}
      </button>
      <Modal
        slug={modalSlug}
        className={baseClass}
      >
        <MinimalTemplate className={`${baseClass}__template`}>
          <h1>{t('confirmDeletion')}</h1>
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

export default DeleteManyDocuments;
