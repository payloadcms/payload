type DelayedRenderProps = {
    /** Time in ms to wait before "mounting" the component. */
    delayBeforeShow: number;
    /** Time in ms for the "enter" phase of the transition, after delay completes. */
    inTimeout: number;
    /** Min time in ms for the "entered" phase of the transition. */
    minShowTime: number;
    /** Time in ms for the exit phase of the transition. */
    outTimeout: number;
    /** `true` starts the mount process.
     * `false` starts the unmount process.
     * */
    show: boolean;
};
type useDelayedRenderT = (props: DelayedRenderProps) => {
    /** `true` if the component has mounted after the timeout. */
    isMounted: boolean;
    /** `true` if the component is unmounting. */
    isUnmounting: boolean;
    /** Call this function to trigger the timeout delay before rendering. */
    triggerDelayedRender: () => void;
};
export declare const useDelayedRender: useDelayedRenderT;
export {};
//# sourceMappingURL=useDelayedRender.d.ts.map