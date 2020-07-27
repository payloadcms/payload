import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import config from 'payload/config';
import { useUser } from '../../data/User';
import { useStepNav } from '../../elements/StepNav';
import Eyebrow from '../../elements/Eyebrow';
import Card from '../../elements/Card';
import Button from '../../elements/Button';

import './index.scss';

const {
  collections,
  globals,
  routes: {
    admin,
  },
} = config;

const baseClass = 'dashboard';

const Dashboard = () => {
  const [filteredGlobals, setFilteredGlobals] = useState([]);
  const { setStepNav } = useStepNav();
  const { push } = useHistory();
  const { permissions } = useUser();

  useEffect(() => {
    setFilteredGlobals(
      globals.filter((global) => permissions?.[global.slug]?.read?.permission),
    );
  }, [permissions]);

  useEffect(() => {
    setStepNav([]);
  }, [setStepNav]);

  return (
    <div className={baseClass}>
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <h3 className={`${baseClass}__label`}>Collections</h3>
        <ul className={`${baseClass}__card-list`}>
          {collections.map((collection) => {
            if (permissions?.[collection.slug]?.read?.permission) {
              return (
                <li key={collection.slug}>
                  <Card
                    title={collection.labels.plural}
                    onClick={() => push({ pathname: `${admin}/collections/${collection.slug}` })}
                    actions={(
                      <Button
                        el="link"
                        to={`${admin}/collections/${collection.slug}/create`}
                        icon="plus"
                        round
                        buttonStyle="icon-label"
                        iconStyle="with-border"
                      />
                    )}
                  />
                </li>
              );
            }

            return null;
          })}
        </ul>
        {(filteredGlobals.length > 0) && (
          <React.Fragment>
            <h3 className={`${baseClass}__label`}>Globals</h3>
            <ul className={`${baseClass}__card-list`}>
              {filteredGlobals.map((global) => (
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

export default Dashboard;
