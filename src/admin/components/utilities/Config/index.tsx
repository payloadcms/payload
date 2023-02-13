import React, { createContext, useContext } from 'react';
import { SanitizedConfig } from '../../../../config/types';

const Context = createContext<SanitizedConfig>({} as SanitizedConfig);

export const ConfigProvider: React.FC<{config: SanitizedConfig, children: React.ReactNode}> = ({ children, config: incomingConfig }) => {
  const [config, setConfig] = React.useState<SanitizedConfig>();
  const hasAwaited = React.useRef(false);

  React.useEffect(() => {
    if (incomingConfig && !hasAwaited.current) {
      hasAwaited.current = true;

      const awaitConfig = async () => {
        const resolvedConfig = await incomingConfig;
        setConfig(resolvedConfig);
      };
      awaitConfig();
    }
  }, [incomingConfig]);

  if (!config) return null;

  return (
    <Context.Provider value={config}>
      {children}
    </Context.Provider>
  );
};

export const useConfig = (): SanitizedConfig => useContext(Context);
