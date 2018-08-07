import PagesAdd from './Pages/Add';
import PagesArchive from './Pages/Archive';
import PagesEdit from './Pages/Edit';

import OrdersAdd from './Orders/Add';
import OrdersArchive from './Orders/Archive';
import OrdersEdit from './Orders/Edit';

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
}
