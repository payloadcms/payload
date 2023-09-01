import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useHistory } from 'react-router-dom';

import type { EntityToGroup, Group} from '../../../utilities/groupNavItems';

import { getTranslation } from '../../../../utilities/getTranslation';
import { EntityType, groupNavItems } from '../../../utilities/groupNavItems';
import Account from '../../graphics/Account';
import Icon from '../../graphics/Icon';
import Chevron from '../../icons/Chevron';
import CloseMenu from '../../icons/CloseMenu';
import Menu from '../../icons/Menu';
import { useAuth } from '../../utilities/Auth';
import { useConfig } from '../../utilities/Config';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import Localizer from '../Localizer';
import Logout from '../Logout';
import NavGroup from '../NavGroup';
import './index.scss';

const baseClass = 'nav';

const DefaultNav = () => {
  const { permissions, user } = useAuth();
  const [menuActive, setMenuActive] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const history = useHistory();
  const { i18n, t } = useTranslation('general');
  const {
    admin: {
      components: {
        afterNavLinks,
        beforeNavLinks,
      },
    },
    collections,
    globals,
    routes: {
      admin,
    },
  } = useConfig();

  const classes = [
    baseClass,
    menuActive && `${baseClass}--menu-active`,
  ].filter(Boolean)
    .join(' ');

  useEffect(() => {
    setGroups(groupNavItems([
      ...collections
        .filter(({ admin: { hidden } }) => !(typeof hidden === 'function' ? hidden({ user }) : hidden))
        .map((collection) => {
          const entityToGroup: EntityToGroup = {
            entity: collection,
            type: EntityType.collection,
          };

          return entityToGroup;
        }),
      ...globals
        .filter(({ admin: { hidden } }) => !(typeof hidden === 'function' ? hidden({ user }) : hidden))
        .map((global) => {
          const entityToGroup: EntityToGroup = {
            entity: global,
            type: EntityType.global,
          };

          return entityToGroup;
        }),
    ], permissions, i18n));
  }, [collections, globals, permissions, i18n, i18n.language, user]);

  useEffect(() => history.listen(() => {
    setMenuActive(false);
  }), [history]);

  return (
    <aside className={classes}>
      <div className={`${baseClass}__scroll`}>
        <header>
          <Link
            aria-label={t('dashboard')}
            className={`${baseClass}__brand`}
            to={admin}
          >
            <Icon />
          </Link>
          <button
            className={`${baseClass}__mobile-menu-btn`}
            onClick={() => setMenuActive(!menuActive)}
            type="button"
          >
            {menuActive && (
              <CloseMenu />
            )}
            {!menuActive && (
              <Menu />
            )}
          </button>
        </header>
        <nav className={`${baseClass}__wrap`}>
          {Array.isArray(beforeNavLinks) && beforeNavLinks.map((Component, i) => <Component key={i} />)}
          {groups.map(({ entities, label }, key) => {
            return (
              <NavGroup {...{ key, label }}>
                {entities.map(({ entity, type }, i) => {
                  let entityLabel: string;
                  let href: string;
                  let id: string;

                  if (type === EntityType.collection) {
                    href = `${admin}/collections/${entity.slug}`;
                    entityLabel = getTranslation(entity.labels.plural, i18n);
                    id = `nav-${entity.slug}`;
                  }

                  if (type === EntityType.global) {
                    href = `${admin}/globals/${entity.slug}`;
                    entityLabel = getTranslation(entity.label, i18n);
                    id = `nav-global-${entity.slug}`;
                  }

                  return (
                    <NavLink
                      activeClassName="active"
                      className={`${baseClass}__link`}
                      id={id}
                      key={i}
                      to={href}
                    >
                      <Chevron />
                      {entityLabel}
                    </NavLink>
                  );
                })}
              </NavGroup>
            );
          })}
          {Array.isArray(afterNavLinks) && afterNavLinks.map((Component, i) => <Component key={i} />)}
          <div className={`${baseClass}__controls`}>
            <Localizer />
            <Link
              aria-label={t('authentication:account')}
              className={`${baseClass}__account`}
              to={`${admin}/account`}
            >
              <Account />
            </Link>
            <Logout />
          </div>
        </nav>
      </div>
    </aside>
  );
};

const Nav: React.FC = () => {
  const {
    admin: {
      components: {
        Nav: CustomNav,
      } = {
        Nav: undefined,
      },
    } = {},
  } = useConfig();

  return (
    <RenderCustomComponent
      CustomComponent={CustomNav}
      DefaultComponent={DefaultNav}
    />
  );
};

export default Nav;
