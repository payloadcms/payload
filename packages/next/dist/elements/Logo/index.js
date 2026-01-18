import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import { PayloadLogo } from '@payloadcms/ui/shared';
export const Logo = props => {
  const {
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user
  } = props;
  const {
    admin: {
      components: {
        graphics: {
          Logo: CustomLogo
        } = {
          Logo: undefined
        }
      } = {}
    } = {}
  } = payload.config;
  return RenderServerComponent({
    Component: CustomLogo,
    Fallback: PayloadLogo,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user
    }
  });
};
//# sourceMappingURL=index.js.map