import React, { useCallback, useEffect, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useWindowInfo } from '@faceless-ui/window-info';
import { useTranslation } from 'react-i18next';
import { Props, TogglerProps } from './types';
import { EditDepthContext, useEditDepth } from '../../utilities/EditDepth';
import { Gutter } from '../Gutter';
import './index.scss';
import X from '../../icons/X';

const baseClass = 'drawer';

const zBase = 100;

export const formatDrawerSlug = ({
  slug,
  depth,
}: {
  slug: string,
  depth: number,
}): string => `drawer_${depth}_${slug}`;

export const DrawerToggler: React.FC<TogglerProps> = ({
  slug,
  children,
  className,
  onClick,
  disabled,
  ...rest
}) => {
  const { openModal } = useModal();

  const handleClick = useCallback((e) => {
    openModal(slug);
    if (typeof onClick === 'function') onClick(e);
  }, [openModal, slug, onClick]);

  return (
    <button
      onClick={handleClick}
      type="button"
      className={className}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export const Drawer: React.FC<Props> = ({
  slug,
  children,
  className,
  header,
  title,
  gutter = true,
}) => {
  const { t } = useTranslation('general');
  const { closeModal, modalState } = useModal();
  const { breakpoints: { m: midBreak } } = useWindowInfo();
  const drawerDepth = useEditDepth();
  const [isOpen, setIsOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setIsOpen(modalState[slug]?.isOpen);
  }, [slug, modalState]);

  useEffect(() => {
    setAnimateIn(isOpen);
  }, [isOpen]);

  if (isOpen) {
    // IMPORTANT: do not render the drawer until it is explicitly open, this is to avoid large html trees especially when nesting drawers

    return (
      <Modal
        slug={slug}
        className={[
          className,
          baseClass,
          animateIn && `${baseClass}--is-open`,
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
          id={`close-drawer__${slug}`}
          type="button"
          onClick={() => closeModal(slug)}
          style={{
            width: `calc(${midBreak ? 'var(--gutter-h)' : 'var(--nav-width)'} + ${drawerDepth - 1} * 25px)`,
          }}
          aria-label={t('close')}
        />
        <div className={`${baseClass}__content`}>
          <Gutter
            className={`${baseClass}__content-children`}
            right={gutter}
            left={gutter}
          >
            <EditDepthContext.Provider value={drawerDepth + 1}>
              {header && header}
              {header === undefined && (
                <div className={`${baseClass}__header`}>
                  <h2 className={`${baseClass}__header__title`}>
                    {title}
                  </h2>
                  <button
                    className={`${baseClass}__header__close`}
                    id={`close-drawer__${slug}`}
                    type="button"
                    onClick={() => closeModal(slug)}
                    aria-label={t('close')}
                  >
                    <X />
                  </button>
                </div>
              )}
              {children}
            </EditDepthContext.Provider>
          </Gutter>
        </div>
      </Modal>
    );
  }

  return null;
};
