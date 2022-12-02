import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useWindowInfo } from '@faceless-ui/window-info';
import { Props, TogglerProps } from './types';
import './index.scss';

const baseClass = 'drawer';

export const DrawerDepthContext = createContext(0);

export const useDrawerDepth = (): number => useContext(DrawerDepthContext);

const zBase = 100;

const formatDrawerSlug = ({
  slug,
  depth,
}: {
  slug: string,
  depth: number,
}) => `drawer-lvl${depth}-${slug}`;

export const DrawerToggler: React.FC<TogglerProps> = ({
  slug,
  formatSlug,
  children,
  className,
  onClick,
  ...rest
}) => {
  const { openModal } = useModal();
  const drawerDepth = useDrawerDepth();

  const handleClick = useCallback((e) => {
    openModal(formatSlug !== false ? formatDrawerSlug({ slug, depth: drawerDepth }) : slug);
    if (typeof onClick === 'function') onClick(e);
  }, [openModal, drawerDepth, slug, onClick, formatSlug]);

  return (
    <button
      onClick={handleClick}
      type="button"
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
};

export const Drawer: React.FC<Props> = ({
  slug,
  formatSlug,
  children,
}) => {
  const { toggleModal, modalState } = useModal();
  const { breakpoints: { m: midBreak } } = useWindowInfo();
  const drawerDepth = useDrawerDepth();
  const [isOpen, setIsOpen] = useState(false);
  const [modalSlug] = useState(() => (formatSlug !== false ? formatDrawerSlug({ slug, depth: drawerDepth }) : slug));

  useEffect(() => {
    setIsOpen(modalState[modalSlug].isOpen);
  }, [modalSlug, modalState]);

  return (
    <Modal
      slug={modalSlug}
      className={[
        baseClass,
        isOpen && `${baseClass}--is-open`,
      ].filter(Boolean).join(' ')}
      style={{
        zIndex: zBase + drawerDepth,
      }}
    >
      {drawerDepth === 0 && (
        <div className={`${baseClass}__blur-bg`} />
      )}
      <button
        className={`${baseClass}__close`}
        type="button"
        onClick={() => toggleModal(modalSlug)}
        style={{
          width: `calc(${midBreak ? 'var(--gutter-h)' : 'var(--nav-width)'} + ${drawerDepth - 1} * 25px)`,
        }}
      >
        <span>
          Close
        </span>
      </button>
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__content-children`}>
          <DrawerDepthContext.Provider value={drawerDepth + 1}>
            {children}
          </DrawerDepthContext.Provider>
        </div>
      </div>
    </Modal>
  );
};

export type IDrawerContext = {
  Drawer: React.FC<Props>,
  DrawerToggler: React.FC<TogglerProps>
}

export const DrawerContext = createContext({
  Drawer,
  DrawerToggler,
});

export const useDrawer = (): IDrawerContext => useContext(DrawerContext);
