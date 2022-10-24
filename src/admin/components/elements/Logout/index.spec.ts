import {
  getSanitizedLogoutRoutes,
  logoutDefaultInactivityRoute,
  logoutDefaultRoute,
} from './index';
import { Config } from '../../../../config/types';
import { buildConfig } from '../../../../config/build';
const baseConfig: Config = {
  telemetry: false,
};
describe('Logout', () => {
  it('getLogout should return default values for default config', () => {
    const sanitizedConfig = buildConfig(baseConfig);
    const { logoutRoute, logoutInactivityRoute } = getSanitizedLogoutRoutes(sanitizedConfig);
    expect(logoutRoute).toBe(logoutDefaultRoute);
    expect(logoutInactivityRoute).toBe(logoutDefaultInactivityRoute);
  });
  it('getLogout should return customized values', () => {
    const sanitizedConfig = buildConfig({
      ...baseConfig,
      admin: {
        components: {
          logout: {
            inactivityRoute: '/test-inactivity-logout',
            route: '/test-logout',
          },
        },
      },
    });
    const { logoutRoute, logoutInactivityRoute } = getSanitizedLogoutRoutes(sanitizedConfig);
    expect(logoutRoute).toBe('/test-logout');
    expect(logoutInactivityRoute).toBe('/test-inactivity-logout');
  });
});
