import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';
import { Modal, useModal } from '@faceless-ui/modal';
import { Trans, useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import Button from '../Button';
import MinimalTemplate from '../../templates/Minimal';
import { useForm } from '../../forms/Form/context';
import useTitle from '../../../hooks/useTitle';
import { requests } from '../../../api';
import { Props } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'delete-document';

const DeleteDocument: React.FC<Props> = (props) => {
  const {
    title: titleFromProps,
    id,
    buttonId,
    collection,
    collection: {
      slug,
      labels: {
        singular,
      } = {},
    } = {},
  } = props;

  const { serverURL, routes: { api, admin } } = useConfig();
  const { setModified } = useForm();
  const [deleting, setDeleting] = useState(false);
  const { toggleModal } = useModal();
  const history = useHistory();
  const { t, i18n } = useTranslation('general');
  const title = useTitle(collection);
  const titleToRender = titleFromProps || title;

  const modalSlug = `delete-${id}`;

  const addDefaultError = useCallback(() => {
    toast.error(t('error:deletingTitle', { title }));
  }, [t, title]);

  const handleDelete = useCallback(() => {
    setDeleting(true);
    setModified(false);
    requests.delete(`${serverURL}${api}/${slug}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': i18n.language,
      },
    }).then(async (res) => {
      try {
        const json = await res.json();
        if (res.status < 400) {
          toggleModal(modalSlug);
          toast.success(t('titleDeleted', { label: getTranslation(singular, i18n), title }));
          return history.push(`${admin}/collections/${slug}`);
        }

        toggleModal(modalSlug);

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
  }, [setModified, serverURL, api, slug, id, toggleModal, modalSlug, t, singular, i18n, title, history, admin, addDefaultError]);

  if (id) {
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
            <p>
              <Trans
                i18nKey="aboutToDelete"
                values={{ label: getTranslation(singular, i18n), title: titleToRender }}
                t={t}
              >
                aboutToDelete
                <strong>
                  {titleToRender}
                </strong>
              </Trans>
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
  }

  return null;
};

export default DeleteDocument;
