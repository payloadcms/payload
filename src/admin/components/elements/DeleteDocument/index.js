import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';
import { Modal, useModal } from '@faceless-ui/modal';
import { useConfig } from '../../providers/Config';
import Button from '../Button';
import MinimalTemplate from '../../templates/Minimal';
import { useForm } from '../../forms/Form/context';
import useTitle from '../../../hooks/useTitle';
import { requests } from '../../../api';

import './index.scss';

const baseClass = 'delete-document';

const DeleteDocument = (props) => {
  const {
    title: titleFromProps,
    id,
    collection: {
      admin: {
        useAsTitle,
      },
      slug,
      labels: {
        singular,
      } = {},
    } = {},
  } = props;

  const { serverURL, routes: { api, admin } } = useConfig();
  const { setModified } = useForm();
  const [deleting, setDeleting] = useState(false);
  const { closeAll, toggle } = useModal();
  const history = useHistory();
  const title = useTitle(useAsTitle) || id;
  const titleToRender = titleFromProps || title;

  const modalSlug = `delete-${id}`;

  const addDefaultError = useCallback(() => {
    toast.error(`There was an error while deleting ${title}. Please check your connection and try again.`);
  }, [title]);

  const handleDelete = useCallback(() => {
    setDeleting(true);
    setModified(false);
    requests.delete(`${serverURL}${api}/${slug}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (res) => {
      try {
        const json = await res.json();
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

        closeAll();

        if (json.errors) {
          toast.error(json.errors);
        }
        addDefaultError();
        return false;
      } catch (e) {
        return addDefaultError();
      }
    });
  }, [addDefaultError, closeAll, history, id, singular, slug, title, admin, api, serverURL, setModified]);

  if (id) {
    return (
      <React.Fragment>
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
              &quot;
              <strong>
                {titleToRender}
              </strong>
              &quot;. Are you sure?
            </p>
            <Button
              buttonStyle="secondary"
              type="button"
              onClick={deleting ? undefined : () => toggle(modalSlug)}
            >
              Cancel
            </Button>
            <Button
              onClick={deleting ? undefined : handleDelete}
            >
              {deleting ? 'Deleting...' : 'Confirm'}
            </Button>
          </MinimalTemplate>
        </Modal>
      </React.Fragment>
    );
  }

  return null;
};

DeleteDocument.defaultProps = {
  title: undefined,
  id: undefined,
};

DeleteDocument.propTypes = {
  collection: PropTypes.shape({
    admin: PropTypes.shape({
      useAsTitle: PropTypes.string,
    }),
    slug: PropTypes.string,
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
  }).isRequired,
  id: PropTypes.string,
  title: PropTypes.string,
};

export default DeleteDocument;
