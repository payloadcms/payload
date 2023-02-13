import { AfterChangeHook } from 'payload/dist/collections/config/types';
import { revalidatePath } from '../../../utilities/revalidatePath';
import { formatAppURL } from '../formatAppURL';

export const revalidatePage: AfterChangeHook = ({ doc }) => {
  const url = new URL(formatAppURL(doc.breadcrumbs));

  revalidatePath(url.pathname);

  if (url.pathname === '/home') {
    revalidatePath('/')
  }

  return doc;
};
