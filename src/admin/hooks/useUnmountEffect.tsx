import { useEffect } from 'react';

// eslint-disable-next-line react-hooks/exhaustive-deps
const useUnmountEffect = (callback: React.EffectCallback): void => useEffect(() => callback, []);

export default useUnmountEffect;
