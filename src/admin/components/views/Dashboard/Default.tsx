import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useConfig } from '../../providers/Config';

import Eyebrow from '../../elements/Eyebrow';
import Card from '../../elements/Card';
import Button from '../../elements/Button';

import './index.scss';

const baseClass = 'dashboard';

const Dashboard = (props) => {
  const {
    collections,
    globals,
    permissions,
  } = props;

  const { push } = useHistory();

  const {
    routes: {
      admin,
    },
  } = useConfig();

  return (
    <div className={baseClass}>
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <h3 className={`${baseClass}__label`}>Collections</h3>
        <ul className={`${baseClass}__card-list`}>
          {collections.map((collection) => {
            const hasCreatePermission = permissions?.[collection.slug]?.create?.permission;

            return (
              <li key={collection.slug}>
                <Card
                  title={collection.labels.plural}
                  onClick={() => push({ pathname: `${admin}/collections/${collection.slug}` })}
                  actions={hasCreatePermission ? (
                    <Button
                      el="link"
                      to={`${admin}/collections/${collection.slug}/create`}
                      icon="plus"
                      round
                      buttonStyle="icon-label"
                      iconStyle="with-border"
                    />
                  ) : undefined}
                />
              </li>
            );
          })}
        </ul>
        {(globals.length > 0) && (
          <React.Fragment>
            <h3 className={`${baseClass}__label`}>Globals</h3>
            <ul className={`${baseClass}__card-list`}>
              {globals.map((global) => (
                <li key={global.slug}>
                  <Card
                    title={global.label}
                    onClick={() => push({ pathname: `${admin}/globals/${global.slug}` })}
                  />
                </li>
              ))}
            </ul>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  collections: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  globals: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  permissions: PropTypes.shape({}).isRequired,
};

export default Dashboard;
