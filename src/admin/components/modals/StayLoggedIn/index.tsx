import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useModal, Modal } from '@faceless-ui/modal';
import { useConfig } from '@payloadcms/config-provider';
import MinimalTemplate from '../../templates/Minimal';
import Button from '../../elements/Button';
import { Props } from './types';

import './index.scss';

const baseClass = 'stay-logged-in';

const StayLoggedInModal: React.FC<Props> = (props) => {
  const { refreshCookie } = props;
  const history = useHistory();
  const { routes: { admin } } = useConfig();
  const { closeAll: closeAllModals } = useModal();

  return (
    <Modal
      className={baseClass}
      slug="stay-logged-in"
    >
      <MinimalTemplate>
        <h1>Stay logged in</h1>
        <p>You haven&apos;t been active in a little while and will shortly be automatically logged out for your own security. Would you like to stay logged in?</p>
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="secondary"
            onClick={() => {
              closeAllModals();
              history.push(`${admin}/logout`);
            }}
          >
            Log out
          </Button>
          <Button onClick={() => {
            refreshCookie();
            closeAllModals();
          }}
          >
            Stay logged in
          </Button>
        </div>
      </MinimalTemplate>
    </Modal>
  );
};

StayLoggedInModal.propTypes = {
  refreshCookie: PropTypes.func.isRequired,
};

export default StayLoggedInModal;
