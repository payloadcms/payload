/// <reference types="react" />
type useThrottledEffect = (callback: React.EffectCallback, delay: number, deps: React.DependencyList) => void;
declare const useThrottledEffect: useThrottledEffect;
export default useThrottledEffect;
