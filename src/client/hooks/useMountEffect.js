import { useEffect } from 'react';

const useMountEffect = func => useEffect(func, []);

export default useMountEffect;
