import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useModal, Modal } from '@trbl/react-modal';
import config from 'payload/config';
import MinimalTemplate from '../../templates/Minimal';
import Button from '../../elements/Button';

import './index.scss';

const baseClass = 'stay-logged-in';

const { routes: { admin } } = config;

const StayLoggedInModal = (props) => {
  const { refreshToken } = props;
  const history = useHistory();
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
          <Button onClick={() => {
            refreshToken();
            closeAllModals();
          }}
          >
            Stay logged in
          </Button>
          <Button
            buttonStyle="secondary"
            onClick={() => {
              closeAllModals();
              history.push(`${admin}/logout`);
            }}
          >
            Log out
          </Button>
        </div>
      </MinimalTemplate>
    </Modal>
  );
};

StayLoggedInModal.propTypes = {
  refreshToken: PropTypes.func.isRequired,
};

export default StayLoggedInModal;
