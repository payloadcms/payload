import { notFound } from 'next/navigation.js';
import { renderListView } from '../List/index.js';
export const TrashView = async args => {
  try {
    const {
      List: TrashList
    } = await renderListView({
      ...args,
      enableRowSelections: true,
      trash: true,
      viewType: 'trash'
    });
    return TrashList;
  } catch (error) {
    if (error.message === 'not-found') {
      notFound();
    }
    console.error(error); // eslint-disable-line no-console
  }
};
//# sourceMappingURL=index.js.map