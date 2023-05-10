import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { ListDrawerProps, ListTogglerProps, UseListDrawer } from './types';
import { Drawer, DrawerToggler } from '../Drawer';
import { useEditDepth } from '../../utilities/EditDepth';
import { ListDrawerContent } from './DrawerContent';
import { useConfig } from '../../utilities/Config';

import './index.scss';

export const baseClass = 'list-drawer';

export const formatListDrawerSlug = ({
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
  const { drawerSlug } = props;

  return (
    <Drawer
      slug={drawerSlug}
      className={baseClass}
      header={false}
      gutter={false}
    >
      <ListDrawerContent
        {...props}
      />
    </Drawer>
  );
};

export const useListDrawer: UseListDrawer = ({
  collectionSlugs: collectionSlugsFromProps,
  uploads,
  selectedCollection,
  filterOptions,
}) => {
  const { collections } = useConfig();
  const drawerDepth = useEditDepth();
  const uuid = useId();
  const { modalState, toggleModal, closeModal, openModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const [collectionSlugs, setCollectionSlugs] = useState(collectionSlugsFromProps);

  const drawerSlug = formatListDrawerSlug({
    depth: drawerDepth,
    uuid,
  });

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen));
  }, [modalState, drawerSlug]);

  useEffect(() => {
    if (!collectionSlugs || collectionSlugs.length === 0) {
      const filteredCollectionSlugs = collections.filter(({ upload }) => {
        if (uploads) {
          return Boolean(upload) === true;
        }
        return true;
      });

      setCollectionSlugs(filteredCollectionSlugs.map(({ slug }) => slug));
    }
  }, [collectionSlugs, uploads, collections]);
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
      />
    ));
  }, [drawerSlug, collectionSlugs, uploads, closeDrawer, selectedCollection, filterOptions]);

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
  }), [drawerDepth, drawerSlug, isOpen, toggleDrawer, closeDrawer, openDrawer]);

  return [
    MemoizedDrawer,
    MemoizedDrawerToggler,
    MemoizedDrawerState,
  ];
};
