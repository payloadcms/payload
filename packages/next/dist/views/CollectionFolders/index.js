import { notFound } from 'next/navigation.js';
import { buildCollectionFolderView } from './buildView.js';
export const CollectionFolderView = async args => {
  try {
    const {
      View
    } = await buildCollectionFolderView(args);
    return View;
  } catch (error) {
    if (error?.message === 'NEXT_REDIRECT') {
      throw error;
    }
    if (error.message === 'not-found') {
      notFound();
    } else {
      console.error(error); // eslint-disable-line no-console
    }
  }
};
//# sourceMappingURL=index.js.map