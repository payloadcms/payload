import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { DocumentDrawerProps, DocumentTogglerProps, UseDocumentDrawer } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';
import { Drawer, DrawerToggler } from '../Drawer';
import { useRelatedCollections } from '../../forms/field-types/Relationship/AddNew/useRelatedCollections';
import { useEditDepth } from '../../utilities/EditDepth';
import { DocumentDrawerContent } from './DrawerContent';

import './index.scss';

export const baseClass = 'doc-drawer';

const formatDocumentDrawerSlug = ({
  collectionSlug,
  id,
  depth,
  uuid,
}: {
  collectionSlug: string,
  id: string,
  depth: number,
  uuid: string, // supply when creating a new document and no id is available
}) => `doc-drawer_${collectionSlug}_${depth}${id ? `_${id}` : ''}_${uuid}`;

export const DocumentDrawerToggler: React.FC<DocumentTogglerProps> = ({
  children,
  className,
  drawerSlug,
  id,
  collectionSlug,
  disabled,
  ...rest
}) => {
  const { t, i18n } = useTranslation(['fields', 'general']);
  const [collectionConfig] = useRelatedCollections(collectionSlug);

  return (
    <DrawerToggler
      slug={drawerSlug}
      className={[
        className,
        `${baseClass}__toggler`,
      ].filter(Boolean).join(' ')}
      disabled={disabled}
      aria-label={t(!id ? 'fields:addNewLabel' : 'general:editLabel', { label: getTranslation(collectionConfig.labels.singular, i18n) })}
      {...rest}
    >
      {children}
    </DrawerToggler>
  );
};

export const DocumentDrawer: React.FC<DocumentDrawerProps> = (props) => {
  const { drawerSlug } = props;

  return (
    <Drawer
      slug={drawerSlug}
      className={baseClass}
      header={false}
      gutter={false}
    >
      <DocumentDrawerContent {...props} />
    </Drawer>
  );
};

export const useDocumentDrawer: UseDocumentDrawer = ({ id, collectionSlug }) => {
  const drawerDepth = useEditDepth();
  const uuid = useId();
  const { modalState, toggleModal, closeModal, openModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const drawerSlug = formatDocumentDrawerSlug({
    collectionSlug,
    id,
    depth: drawerDepth,
    uuid,
  });

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen));
  }, [modalState, drawerSlug]);

  const toggleDrawer = useCallback(() => {
    toggleModal(drawerSlug);
  }, [toggleModal, drawerSlug]);

  const closeDrawer = useCallback(() => {
    closeModal(drawerSlug);
  }, [closeModal, drawerSlug]);

  const openDrawer = useCallback(() => {
    openModal(drawerSlug);
  }, [openModal, drawerSlug]);

  const MemoizedDrawer = useMemo(() => {
    return ((props) => (
      <DocumentDrawer
        {...props}
        collectionSlug={collectionSlug}
        id={id}
        drawerSlug={drawerSlug}
        key={drawerSlug}
      />
    ));
  }, [id, drawerSlug, collectionSlug]);

  const MemoizedDrawerToggler = useMemo(() => {
    return ((props) => (
      <DocumentDrawerToggler
        {...props}
        id={id}
        collectionSlug={collectionSlug}
        drawerSlug={drawerSlug}
      />
    ));
  }, [id, drawerSlug, collectionSlug]);

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
