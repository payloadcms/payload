import React, { createContext, useContext, useEffect, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useWindowInfo } from '@faceless-ui/window-info';
import { IModalContext } from '@faceless-ui/modal/dist/ModalProvider/context';
import { Props } from './types';
import './index.scss';

const baseClass = 'drawer';

export const useDrawer = (): IModalContext => {
  const modalContext = useModal();
  return modalContext;
};

export const DrawerDepthContext = createContext(1);

export const useDrawerDepth = (): number => useContext(DrawerDepthContext);

const baseZIndex = 100;

const Drawer: React.FC<Props> = ({
  modalSlug,
  children,
}) => {
  const { toggleModal } = useModal();
  const { breakpoints: { m: midBreak } } = useWindowInfo();
  const [isAnimated, setIsAnimated] = useState(false);
  const drawerDepth = useDrawerDepth();

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  return (
    <Modal
      slug={modalSlug}
      className={[
        baseClass,
        isAnimated && `${baseClass}--animated`,
      ].filter(Boolean).join(' ')}
      style={{
        zIndex: baseZIndex + drawerDepth,
      }}
    >
      {drawerDepth === 1 && (
        <div className={`${baseClass}__blur-bg`} />
      )}
      <DrawerDepthContext.Provider value={drawerDepth + 1}>
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
            {children}
          </div>
        </div>
      </DrawerDepthContext.Provider>
    </Modal>
  );
};

export default Drawer;
