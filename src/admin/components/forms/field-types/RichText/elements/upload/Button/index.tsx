import React, { Fragment, useId } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import ElementButton from '../../Button';
import UploadIcon from '../../../../../../icons/Upload';
import { Drawer, formatDrawerSlug } from '../../../../../../elements/Drawer';
import { DrawerContent } from './DrawerContent';
import { useEditDepth } from '../../../../../../utilities/EditDepth';

const UploadButton: React.FC<{ path: string }> = ({ path }) => {
  const { t } = useTranslation(['upload', 'general']);
  const { openModal } = useModal();

  const editDepth = useEditDepth();
  const uuid = useId();
  const drawerSlug = formatDrawerSlug({
    slug: `${path}-add-upload-${uuid}`,
    depth: editDepth,
  });

  return (
    <Fragment>
      <ElementButton
        format="upload"
        onClick={() => openModal(drawerSlug)}
        tooltip={t('fields:addLabel', { label: '' })}
      >
        <UploadIcon />
      </ElementButton>
      <Drawer
        slug={drawerSlug}
        formatSlug={false}
      >
        <DrawerContent
          drawerSlug={drawerSlug}
        />
      </Drawer>
    </Fragment>
  );
};

export default UploadButton;
