import PagesAdd from '../Page/components/Add';
import PagesArchive from '../Page/components/Archive';
import PagesEdit from '../Page/components/Edit';

import OrdersAdd from '../Order/components/Add';
import OrdersArchive from '../Order/components/Archive';
import OrdersEdit from '../Order/components/Edit';

export default {
  orders: {
    Add: OrdersAdd,
    Archive: OrdersArchive,
    Edit: OrdersEdit
  },

  pages: {
    Add: PagesAdd,
    Archive: PagesArchive,
    Edit: PagesEdit
  }
};
