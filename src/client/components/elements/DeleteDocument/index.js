import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import config from 'payload/config';
import { useHistory } from 'react-router-dom';
import { Modal, useModal } from '@trbl/react-modal';
import Button from '../Button';
import MinimalTemplate from '../../templates/Minimal';
import useTitle from '../../../hooks/useTitle';
import { requests } from '../../../api';
import { useStatusList } from '../Status';

import './index.scss';

const { serverURL, routes: { api, admin } } = config;

const baseClass = 'delete-document';

const DeleteDocument = (props) => {
  const {
    title: titleFromProps,
    id,
    collection: {
      useAsTitle,
      slug,
      labels: {
        singular,
      } = {},
    } = {},
  } = props;

  const { replaceStatus } = useStatusList();
  const [deleting, setDeleting] = useState(false);
  const { closeAll, toggle } = useModal();
  const history = useHistory();
  const title = useTitle(useAsTitle) || id;
  const titleToRender = titleFromProps || title;

  const modalSlug = `delete-${id}`;

  const addDefaultError = useCallback(() => {
    replaceStatus([{
      message: `There was an error while deleting ${title}. Please check your connection and try again.`,
      type: 'error',
    }]);
  }, [replaceStatus, title]);

  const handleDelete = useCallback(() => {
    setDeleting(true);
    requests.delete(`${serverURL}${api}/${slug}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => {
      return res.json().then((json) => {
        if (res.status < 400) {
          closeAll();
          return history.push({
            pathname: `${admin}/collections/${slug}`,
            state: {
              status: {
                message: `${singular} "${title}" successfully deleted.`,
              },
            },
          });
        }

        setDeleting(false);
        closeAll();
        if (json.errors) {
          replaceStatus(json.errors);
        }
        addDefaultError();

        return false;
      }).catch(() => {
        addDefaultError();
      });
    });
  }, [addDefaultError, closeAll, history, id, replaceStatus, singular, slug, title]);

  return (
    <>
      <button
        type="button"
        slug={modalSlug}
        className={`${baseClass}__toggle`}
        onClick={(e) => {
          e.preventDefault();
          toggle(modalSlug);
        }}
      >
        Delete
      </button>
      <Modal
        slug={modalSlug}
        className={baseClass}
      >
        <MinimalTemplate>
          <h1>Confirm deletion</h1>
          <p>
            You are about to delete the
            {' '}
            {singular}
            {' '}
            document
            {' '}
            &quot;
            <strong>
              {titleToRender}
            </strong>
            &quot;. Are you sure?
          </p>
          {!deleting && (
            <Button
              buttonStyle="secondary"
              type="button"
              onClick={() => {
                toggle(modalSlug);
              }}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={deleting ? undefined : handleDelete}
          >
            {deleting ? 'Deleting...' : 'Confirm'}
          </Button>
        </MinimalTemplate>
      </Modal>
    </>
  );
};

DeleteDocument.defaultProps = {
  title: undefined,
};

DeleteDocument.propTypes = {
  collection: PropTypes.shape({
    useAsTitle: PropTypes.string,
    slug: PropTypes.string,
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
  }).isRequired,
  id: PropTypes.string.isRequired,
  title: PropTypes.string,
};

export default DeleteDocument;
