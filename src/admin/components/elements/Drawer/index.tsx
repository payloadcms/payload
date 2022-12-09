import React, { useCallback, useEffect, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useWindowInfo } from '@faceless-ui/window-info';
import { useTranslation } from 'react-i18next';
import { Props, TogglerProps } from './types';
import { EditDepthContext, useEditDepth } from '../../utilities/EditDepth';
import './index.scss';

const baseClass = 'drawer';

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
  const drawerDepth = useEditDepth();

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
  className,
}) => {
  const { t } = useTranslation('general');
  const { closeModal, modalState } = useModal();
  const { breakpoints: { m: midBreak } } = useWindowInfo();
  const drawerDepth = useEditDepth();
  const [isOpen, setIsOpen] = useState(false);
  const [modalSlug] = useState(() => (formatSlug !== false ? formatDrawerSlug({ slug, depth: drawerDepth }) : slug));

  useEffect(() => {
    setIsOpen(modalState[modalSlug].isOpen);
  }, [modalSlug, modalState]);

  return (
    <Modal
      slug={modalSlug}
      className={[
        className,
        baseClass,
        isOpen && `${baseClass}--is-open`,
      ].filter(Boolean).join(' ')}
      style={{
        zIndex: zBase + drawerDepth,
      }}
    >
      {drawerDepth === 1 && (
        <div className={`${baseClass}__blur-bg`} />
      )}
      <button
        className={`${baseClass}__close`}
        type="button"
        onClick={() => closeModal(modalSlug)}
        style={{
          width: `calc(${midBreak ? 'var(--gutter-h)' : 'var(--nav-width)'} + ${drawerDepth - 1} * 25px)`,
        }}
        aria-label={t('close')}
      />
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__content-children`}>
          <EditDepthContext.Provider value={drawerDepth + 1}>
            {children}
          </EditDepthContext.Provider>
        </div>
      </div>
    </Modal>
  );
};
