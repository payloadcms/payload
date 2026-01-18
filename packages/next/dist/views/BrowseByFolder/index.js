import { notFound } from 'next/navigation.js';
import { buildBrowseByFolderView } from './buildView.js';
export const BrowseByFolder = async args => {
  try {
    const {
      View
    } = await buildBrowseByFolderView(args);
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