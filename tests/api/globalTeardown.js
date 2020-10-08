const globalTeardown = async () => {
  const serverClosePromise = new Promise((resolve) => global.PAYLOAD_SERVER.close(resolve));
  await serverClosePromise;
};

module.exports = globalTeardown;
