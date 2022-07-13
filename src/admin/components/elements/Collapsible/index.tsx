import React, { useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { Props } from './types';
import { CollapsibleProvider, useCollapsible } from './provider';
import Chevron from '../../icons/Chevron';

import './index.scss';

const baseClass = 'collapsible';

export const Collapsible: React.FC<Props> = ({ children, onToggle, className, header, initCollapsed }) => {
  const [collapsed, setCollapsed] = useState(Boolean(initCollapsed));
  const isNested = useCollapsible();

  return (
    <div className={[
      baseClass,
      className,
      collapsed && `${baseClass}--collapsed`,
      isNested && `${baseClass}--nested`,
    ].filter(Boolean).join(' ')}
    >
      <CollapsibleProvider withinCollapsible>
        <button
          type="button"
          className={`${baseClass}__toggle ${baseClass}__toggle--${collapsed ? 'collapsed' : 'open'}`}
          onClick={() => {
            if (typeof onToggle === 'function') onToggle(!collapsed);
            setCollapsed(!collapsed);
          }}
        >
          {header && (
            <div className={`${baseClass}__header-wrap`}>
              {header}
            </div>
          )}
          <Chevron className={`${baseClass}__indicator`} />
        </button>
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
