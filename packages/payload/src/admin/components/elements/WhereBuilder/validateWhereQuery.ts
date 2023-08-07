import { Where } from '../../../../types';

const validateWhereQuery = (whereQuery): whereQuery is Where => {
  if (whereQuery?.or?.length > 0 && whereQuery?.or?.[0]?.and && whereQuery?.or?.[0]?.and?.length > 0) {
    return true;
  }

  return false;
};

export default validateWhereQuery;
