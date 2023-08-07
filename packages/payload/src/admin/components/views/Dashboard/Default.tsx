import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';

import Eyebrow from '../../elements/Eyebrow';
import Card from '../../elements/Card';
import Button from '../../elements/Button';
import { Props } from './types';
import { Gutter } from '../../elements/Gutter';
import { EntityToGroup, EntityType, Group, groupNavItems } from '../../../utilities/groupNavItems';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'dashboard';

const Dashboard: React.FC<Props> = (props) => {
  const {
    collections,
    globals,
    permissions,
    user,
  } = props;

  const { push } = useHistory();
  const { i18n } = useTranslation('general');

  const {
    routes: {
      admin,
    },
    admin: {
      components: {
        afterDashboard,
        beforeDashboard,
      },
    },
  } = useConfig();

  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    setGroups(groupNavItems([
      ...collections
        .filter(({ admin: { hidden } }) => !(typeof hidden === 'function' ? hidden({ user }) : hidden))
        .map((collection) => {
          const entityToGroup: EntityToGroup = {
            type: EntityType.collection,
            entity: collection,
          };

          return entityToGroup;
        }),
      ...globals
        .filter(({ admin: { hidden } }) => !(typeof hidden === 'function' ? hidden({ user }) : hidden))
        .map((global) => {
          const entityToGroup: EntityToGroup = {
            type: EntityType.global,
            entity: global,
          };

          return entityToGroup;
        }),
    ], permissions, i18n));
  }, [collections, globals, i18n, permissions, user]);

  return (
    <div className={baseClass}>
      <Eyebrow />
      <Gutter className={`${baseClass}__wrap`}>
        {Array.isArray(beforeDashboard) && beforeDashboard.map((Component, i) => <Component key={i} />)}
        {groups.map(({ label, entities }, groupIndex) => {
          return (
            <React.Fragment key={groupIndex}>
              <h2 className={`${baseClass}__label`}>{label}</h2>
              <ul className={`${baseClass}__card-list`}>
                {entities.map(({ entity, type }, entityIndex) => {
                  let title: string;
                  let createHREF: string;
                  let onClick: () => void;
                  let hasCreatePermission: boolean;

                  if (type === EntityType.collection) {
                    title = getTranslation(entity.labels.plural, i18n);
                    onClick = () => push({ pathname: `${admin}/collections/${entity.slug}` });
                    createHREF = `${admin}/collections/${entity.slug}/create`;
                    hasCreatePermission = permissions?.collections?.[entity.slug]?.create?.permission;
                  }

                  if (type === EntityType.global) {
                    title = getTranslation(entity.label, i18n);
                    onClick = () => push({ pathname: `${admin}/globals/${entity.slug}` });
                  }

                  return (
                    <li key={entityIndex}>
                      <Card
                        title={title}
                        id={`card-${entity.slug}`}
                        onClick={onClick}
                        actions={(hasCreatePermission && type === EntityType.collection) ? (
                          <Button
                            el="link"
                            to={createHREF}
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
            </React.Fragment>
          );
        })}
        {Array.isArray(afterDashboard) && afterDashboard.map((Component, i) => <Component key={i} />)}
      </Gutter>
    </div>
  );
};

export default Dashboard;
