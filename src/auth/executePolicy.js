const executePolicy = async (user, policy) => {
  if (policy) {
    const result = await policy(user);

    if (!result) {
      return false;
    }

    return true;
  }

  if (user) {
    return true;
  }

  return false;
};

module.exports = executePolicy;
