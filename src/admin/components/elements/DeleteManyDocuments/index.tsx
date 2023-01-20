import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import queryString from 'qs';
import { useHistory } from 'react-router-dom';
import { Where } from '../../../../types';
import { useConfig } from '../../utilities/Config';
import Button from '../Button';
import MinimalTemplate from '../../templates/Minimal';
import { requests } from '../../../api';
import { Props } from './types';
import { SelectAllStatus, useSelection } from '../../views/collections/List/SelectionProvider';
import { getTranslation } from '../../../../utilities/getTranslation';
import Pill from '../Pill';

import './index.scss';

const baseClass = 'delete-documents';

const DeleteManyDocuments: React.FC<Props> = (props) => {
  const {
    resetParams,
    collection: {
      slug,
      labels: {
        plural,
      },
    } = {},
  } = props;

  const { serverURL, routes: { api } } = useConfig();
  const history = useHistory();
  const [deleting, setDeleting] = useState(false);
  const { toggleModal } = useModal();
  const { t, i18n } = useTranslation('general');
  const { selected, selectAll, count } = useSelection();

  const modalSlug = `delete-${slug}`;

  const addDefaultError = useCallback(() => {
    toast.error(t('error:deletingTitle'));
  }, [t]);

  const handleDelete = useCallback(() => {
    setDeleting(true);

    let where: Where;
    if (selectAll === SelectAllStatus.AllAvailable) {
      const params = queryString.parse(history.location.search, { ignoreQueryPrefix: true }).where as Where;
      where = params || {
        id: { not_equals: '' },
      };
    } else {
      where = {
        id: {
          in: Object.keys(selected).filter((id) => selected[id]).map((id) => id),
        },
      };
    }
    const params = queryString.stringify({
      where,
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
          toast.success(t('deletedSuccessfully'));
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
  }, [addDefaultError, api, history, i18n.language, modalSlug, resetParams, selectAll, selected, serverURL, slug, t, toggleModal]);

  if (selectAll === SelectAllStatus.None) {
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

export default DeleteManyDocuments;
