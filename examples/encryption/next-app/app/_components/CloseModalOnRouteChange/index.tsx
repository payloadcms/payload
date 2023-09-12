'use client'

import React, { useEffect } from 'react';
import { useModal } from '@faceless-ui/modal';
import { usePathname } from 'next/navigation'

export const CloseModalOnRouteChange: React.FC = () => {
  const { closeAllModals } = useModal();
  const pathname = usePathname()

  useEffect(() => {
    closeAllModals();
  }, [pathname, closeAllModals]);

  return null;
};
