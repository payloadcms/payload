import React, { useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import { CollapsibleProvider, useCollapsible } from './provider';
import Chevron from '../../icons/Chevron';
import DragHandle from '../../icons/Drag';

import './index.scss';

const baseClass = 'collapsible';

export const Collapsible: React.FC<Props> = ({
  children,
  collapsed: collapsedFromProps,
  onToggle,
  className,
  header,
  initCollapsed,
  dragHandleProps,
  actions,
}) => {
  const [collapsedLocal, setCollapsedLocal] = useState(Boolean(initCollapsed));
  const [hovered, setHovered] = useState(false);
  const isNested = useCollapsible();
  const { t } = useTranslation('fields');

  const collapsed = typeof collapsedFromProps === 'boolean' ? collapsedFromProps : collapsedLocal;

  return (
    <div className={[
      baseClass,
      className,
      dragHandleProps && `${baseClass}--has-drag-handle`,
      collapsed && `${baseClass}--collapsed`,
      isNested && `${baseClass}--nested`,
      hovered && `${baseClass}--hovered`,
    ].filter(Boolean).join(' ')}
    >
      <CollapsibleProvider>
        <div
          className={`${baseClass}__toggle-wrap`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {dragHandleProps && (
            <div
              className={`${baseClass}__drag`}
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
            >
              <DragHandle />
            </div>
          )}
          <button
            type="button"
            className={[
              `${baseClass}__toggle`,
              `${baseClass}__toggle--${collapsed ? 'collapsed' : 'open'}`,
            ].filter(Boolean).join(' ')}
            onClick={() => {
              if (typeof onToggle === 'function') onToggle(!collapsed);
              setCollapsedLocal(!collapsed);
            }}
          >
            <span>
              {t('toggleBlock')}
            </span>
          </button>
          {header && (
            <div className={[
              `${baseClass}__header-wrap`,
              dragHandleProps && `${baseClass}__header-wrap--has-drag-handle`,
            ].filter(Boolean).join(' ')}
            >
              {header && header}
            </div>
          )}
          <div className={`${baseClass}__actions-wrap`}>
            {actions && (
              <div className={`${baseClass}__actions`}>
                {actions}
              </div>
            )}
            <Chevron className={`${baseClass}__indicator`} />
          </div>
        </div>
        <AnimateHeight
          height={collapsed ? 0 : 'auto'}
          duration={200}
        >
          <div className={`${baseClass}__content`}>
            {children}
          </div>
        </AnimateHeight>
      </CollapsibleProvider>
    </div>
  );
};
