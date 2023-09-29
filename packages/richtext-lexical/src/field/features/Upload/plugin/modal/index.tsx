import * as React from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { Drawer } from 'payload/components/elements';
import { useEditDepth } from 'payload/components/utilities';
import { ListDrawerContent } from 'payload/distadmin/components/elements/ListDrawer/DrawerContent';
import {
  baseClass,
  formatListDrawerSlug,
  ListDrawerToggler,
} from 'payload/distadmin/components/elements/ListDrawer/index';
import {
  type ListDrawerProps,
  type UseListDrawer,
} from 'payload/distadmin/components/elements/ListDrawer/types';
import { useConfig } from 'payload/distadmin/components/utilities/Config/index';

import { useModal } from '@faceless-ui/modal';

// TODO: Prefer React function definitions over variable declarations and React.FC
export const ListDrawer: React.FC<ListDrawerProps> = (props) => {
  console.log('Drawerer:', Drawer);
  const { drawerSlug } = props;

  return (
    <Drawer slug={drawerSlug ?? ''} className={baseClass} header={false} gutter={false}>
      <ListDrawerContent {...props} />
    </Drawer>
  );
};

// TODO: Prefer React function definitions (above) over variable declarations
ListDrawer.displayName = 'ListDrawer';

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
    if (collectionSlugs == null || collectionSlugs.length === 0) {
      const filteredCollectionSlugs = collections.filter(({ upload }) => {
        if (uploads != null) {
          return Boolean(upload);
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
    // eslint-disable-next-line react/display-name
    return (props: JSX.IntrinsicAttributes & ListDrawerProps): JSX.Element => (
      <ListDrawer
        {...props}
        drawerSlug={drawerSlug}
        collectionSlugs={collectionSlugs ?? []}
        // @ts-expect-error: TODO: eslint typescript - uploads do not exist as a prop on ListDrawer
        uploads={uploads}
        closeDrawer={closeDrawer}
        key={drawerSlug}
        selectedCollection={selectedCollection}
        filterOptions={filterOptions}
      />
    );
  }, [drawerSlug, collectionSlugs, uploads, closeDrawer, selectedCollection, filterOptions]);

  const MemoizedDrawerToggler = useMemo(() => {
    // eslint-disable-next-line react/display-name
    return (
      props: JSX.IntrinsicAttributes &
        React.HTMLAttributes<HTMLButtonElement> & {
          children?: React.ReactNode;
          className?: string | undefined;
          drawerSlug?: string | undefined;
          disabled?: boolean | undefined;
        }
    ) => <ListDrawerToggler {...props} drawerSlug={drawerSlug} />;
  }, [drawerSlug]);

  const MemoizedDrawerState = useMemo(
    () => ({
      drawerSlug,
      drawerDepth,
      isDrawerOpen: isOpen,
      toggleDrawer,
      closeDrawer,
      openDrawer,
    }),
    [drawerDepth, drawerSlug, isOpen, toggleDrawer, closeDrawer, openDrawer]
  );

  return [MemoizedDrawer, MemoizedDrawerToggler, MemoizedDrawerState];
};
