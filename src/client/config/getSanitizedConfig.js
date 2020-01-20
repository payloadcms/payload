import config from 'payload-config';

const getSanitizedConfig = () => {
  const sanitizedConfig = { ...config };

  sanitizedConfig.routes = {
    admin: (config.routes && config.routes.admin) ? config.routes.admin : '/admin',
  };

  return sanitizedConfig;
};

export default getSanitizedConfig;
