import { Modal, useModal } from '@faceless-ui/modal';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

import type { Props } from './types';

import Button from '../../elements/Button';
import MinimalTemplate from '../../templates/Minimal';
import { useConfig } from '../../utilities/Config';
import './index.scss';

const baseClass = 'stay-logged-in';

const modalSlug = 'stay-logged-in';

const StayLoggedInModal: React.FC<Props> = (props) => {
  const { refreshCookie } = props;
  const history = useHistory();
  const config = useConfig();
  const {
    admin: {
      logoutRoute,
    },
    routes: { admin },
  } = config;
  const { toggleModal } = useModal();
  const { t } = useTranslation('authentication');

  return (
    <Modal
      className={baseClass}
      slug="stay-logged-in"
    >
      <MinimalTemplate className={`${baseClass}__template`}>
        <h1>{t('stayLoggedIn')}</h1>
        <p>{t('youAreInactive')}</p>
        <div className={`${baseClass}__actions`}>
          <Button
            onClick={() => {
              toggleModal(modalSlug);
              history.push(`${admin}${logoutRoute}`);
            }}
            buttonStyle="secondary"
          >
            {t('logOut')}
          </Button>
          <Button onClick={() => {
            refreshCookie();
            toggleModal(modalSlug);
          }}
          >
            {t('stayLoggedIn')}
          </Button>
        </div>
      </MinimalTemplate>
    </Modal>
  );
};

export default StayLoggedInModal;
