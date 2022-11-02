import React, { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import { Props } from './types';
import Button from '../Button';
import { requests } from '../../../api';
import { useForm, useFormModified } from '../../forms/Form/context';
import MinimalTemplate from '../../templates/Minimal';

import './index.scss';

const baseClass = 'duplicate';

const Duplicate: React.FC<Props> = ({ slug, collection, id }) => {
  const { push } = useHistory();
  const modified = useFormModified();
  const { toggleModal } = useModal();
  const { setModified } = useForm();
  const { serverURL, routes: { api }, localization } = useConfig();
  const { routes: { admin } } = useConfig();
  const [hasClicked, setHasClicked] = useState<boolean>(false);
  const { t } = useTranslation('general');

  const modalSlug = `duplicate-${id}`;

  const handleClick = useCallback(async (override = false) => {
    setHasClicked(true);

    if (modified && !override) {
      toggleModal(modalSlug);
      return;
    }

    const create = async (locale = ''): Promise<string | null> => {
      const response = await requests.get(`${serverURL}${api}/${slug}/${id}`, {
        locale,
        depth: 0,
      });
      let data = await response.json();

      if (typeof collection.admin.hooks?.beforeDuplicate === 'function') {
        data = await collection.admin.hooks.beforeDuplicate({
          data,
          locale,
        });
      }

      const result = await requests.post(`${serverURL}${api}/${slug}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const json = await result.json();

      if (result.status === 201) {
        return json.doc.id;
      }
      json.errors.forEach((error) => toast.error(error.message));
      return null;
    };

    let duplicateID;
    if (localization) {
      duplicateID = await create(localization.defaultLocale);
      let abort = false;
      localization.locales
        .filter((locale) => locale !== localization.defaultLocale)
        .forEach(async (locale) => {
          if (!abort) {
            const res = await requests.get(`${serverURL}${api}/${slug}/${id}`, {
              locale,
              depth: 0,
            });
            let localizedDoc = await res.json();

            if (typeof collection.admin.hooks?.beforeDuplicate === 'function') {
              localizedDoc = await collection.admin.hooks.beforeDuplicate({
                data: localizedDoc,
                locale,
              });
            }

            const patchResult = await requests.patch(`${serverURL}${api}/${slug}/${duplicateID}?locale=${locale}`, {
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(localizedDoc),
            });
            if (patchResult.status > 400) {
              abort = true;
              const json = await patchResult.json();
              json.errors.forEach((error) => toast.error(error.message));
            }
          }
        });
      if (abort) {
        // delete the duplicate doc to prevent incomplete
        await requests.delete(`${serverURL}${api}/${slug}/${id}`);
      }
    } else {
      duplicateID = await create();
    }

    toast.success(t('successfullyDuplicated', { label: collection.labels.singular }),
      { autoClose: 3000 });

    setModified(false);

    setTimeout(() => {
      push({
        pathname: `${admin}/collections/${slug}/${duplicateID}`,
      });
    }, 10);
  }, [modified, localization, t, collection.labels.singular, collection.admin.hooks, setModified, toggleModal, modalSlug, serverURL, api, slug, id, push, admin]);

  const confirm = useCallback(async () => {
    setHasClicked(false);
    await handleClick(true);
  }, [handleClick]);

  return (
    <React.Fragment>
      <Button
        id="action-duplicate"
        buttonStyle="none"
        className={baseClass}
        onClick={() => handleClick(false)}
      >
        {t('duplicate')}
      </Button>
      {modified && hasClicked && (
        <Modal
          slug={modalSlug}
          className={`${baseClass}__modal`}
        >
          <MinimalTemplate className={`${baseClass}__modal-template`}>
            <h1>{t('confirmDuplication')}</h1>
            <p>
              {t('unsavedChangesDuplicate')}
            </p>
            <Button
              id="confirm-cancel"
              buttonStyle="secondary"
              type="button"
              onClick={() => toggleModal(modalSlug)}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={confirm}
              id="confirm-duplicate"
            >
              {t('duplicateWithoutSaving')}
            </Button>
          </MinimalTemplate>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default Duplicate;
