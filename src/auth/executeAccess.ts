import { Forbidden } from '../errors';
import { Access } from '../config/types';

const executeAccess = async (operation, access: Access): Promise<boolean> => {
  if (access) {
    const result = await access(operation);

    if (!result) {
      if (!operation.disableErrors) throw new Forbidden();
    }

    return result;
  }

  if (operation.req.user) {
    return true;
  }

  if (!operation.disableErrors) throw new Forbidden();
  return false;
};

export default executeAccess;
