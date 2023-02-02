import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { ListDrawerProps, ListTogglerProps, UseListDrawer } from './types';
import { Drawer, DrawerToggler } from '../Drawer';
import { useEditDepth } from '../../utilities/EditDepth';
import { ListDrawerContent } from './DrawerContent';
import { useConfig } from '../../utilities/Config';
import { useIsWithinRichText } from '../../forms/field-types/RichText/provider';

import './index.scss';

export const baseClass = 'list-drawer';

const drawerHasContent = ({
  coll: {
    admin: { enableRichTextRelationship },
    upload,
    slug,
  },
  uploads,
  collectionSlugs,
  withinRichText = false,
}) => {
  const canRenderFromOrigin = withinRichText ? enableRichTextRelationship : true;
  const hasContentToRender = (uploads && Boolean(upload)) || collectionSlugs?.includes(slug);

  return canRenderFromOrigin && hasContentToRender;
};

const formatListDrawerSlug = ({
  depth,
  uuid,
}: {
  depth: number,
  uuid: string, // supply when creating a new document and no id is available
}) => `list-drawer_${depth}_${uuid}`;

export const ListDrawerToggler: React.FC<ListTogglerProps> = ({
  children,
  className,
  drawerSlug,
  disabled,
  ...rest
}) => {
  return (
    <DrawerToggler
      slug={drawerSlug}
      className={[
        className,
        `${baseClass}__toggler`,
      ].filter(Boolean).join(' ')}
      disabled={disabled}
      {...rest}
    >
      {children}
    </DrawerToggler>
  );
};

export const ListDrawer: React.FC<ListDrawerProps> = (props) => {
  const { drawerSlug, enabledCollectionConfigs } = props;

  if (!enabledCollectionConfigs.length) return null;

  return (
    <Drawer
      slug={drawerSlug}
      className={baseClass}
      header={false}
      gutter={false}
    >
      <ListDrawerContent
        {...props}
        drawerSlug={drawerSlug}
        enabledCollectionConfigs={enabledCollectionConfigs}
      />
    </Drawer>
  );
};

export const useListDrawer: UseListDrawer = ({
  collectionSlugs,
  uploads,
  selectedCollection,
  filterOptions,
}) => {
  const { collections } = useConfig();
  const isWithinRichText = useIsWithinRichText();
  const drawerDepth = useEditDepth();
  const uuid = useId();
  const { modalState, toggleModal, closeModal, openModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const drawerSlug = formatListDrawerSlug({
    depth: drawerDepth,
    uuid,
  });
  const [enabledCollectionConfigs] = useState(() => collections.filter((coll) => drawerHasContent({ coll, withinRichText: isWithinRichText, uploads, collectionSlugs })));

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen));
  }, [modalState, drawerSlug]);

  const toggleDrawer = useCallback(() => {
    toggleModal(drawerSlug);
  }, [toggleModal, drawerSlug]);

  const closeDrawer = useCallback(() => {
    closeModal(drawerSlug);
  }, [drawerSlug, closeModal]);

  const openDrawer = useCallback(() => {
    openModal(drawerSlug);
  }, [drawerSlug, openModal]);

  const MemoizedDrawer = useMemo(() => {
    return ((props) => (
      <ListDrawer
        {...props}
        drawerSlug={drawerSlug}
        collectionSlugs={collectionSlugs}
        uploads={uploads}
        closeDrawer={closeDrawer}
        key={drawerSlug}
        selectedCollection={selectedCollection}
        filterOptions={filterOptions}
        enabledCollectionConfigs={enabledCollectionConfigs}
      />
    ));
  }, [drawerSlug, collectionSlugs, uploads, closeDrawer, selectedCollection, filterOptions, enabledCollectionConfigs]);

  const MemoizedDrawerToggler = useMemo(() => {
    return ((props) => (
      <ListDrawerToggler
        {...props}
        drawerSlug={drawerSlug}
      />
    ));
  }, [drawerSlug]);

  const MemoizedDrawerState = useMemo(() => ({
    drawerSlug,
    drawerDepth,
    isDrawerOpen: isOpen,
    toggleDrawer,
    closeDrawer,
    openDrawer,
    isEmpty: Array.isArray(enabledCollectionConfigs) ? enabledCollectionConfigs.length === 0 : true,
  }), [drawerDepth, drawerSlug, isOpen, toggleDrawer, closeDrawer, openDrawer, enabledCollectionConfigs]);

  return [
    MemoizedDrawer,
    MemoizedDrawerToggler,
    MemoizedDrawerState,
  ];
};
