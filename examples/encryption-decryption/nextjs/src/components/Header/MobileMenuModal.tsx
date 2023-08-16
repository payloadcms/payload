import { Modal } from "@faceless-ui/modal";
import { HeaderBar } from ".";
import { MainMenu } from "../../../../cms/src/payload-types"
import { Gutter } from "../Gutter";
import { CMSLink } from "../Link";

import classes from './mobileMenuModal.module.scss';

type Props = {
  navItems: MainMenu['navItems'];
}

export const slug = 'menu-modal';

export const MobileMenuModal: React.FC<Props> = ({ navItems }) => {
  return (
    <Modal slug={slug} className={classes.mobileMenuModal}>
      <HeaderBar />

      <Gutter>
        <div className={classes.mobileMenuItems}>
          <CMSLink type='custom' url='/settings' label='Settings' className={classes.menuItem} />
        </div>
      </Gutter>
    </Modal>
  )
}
