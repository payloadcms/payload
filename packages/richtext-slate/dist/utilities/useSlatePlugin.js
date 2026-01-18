import { useAddClientFunction } from '@payloadcms/ui';
import { useSlateProps } from './SlatePropsProvider.js';
export const useSlatePlugin = (key, plugin)=>{
    const { schemaPath } = useSlateProps();
    useAddClientFunction(`slatePlugin.${schemaPath}.${key}`, plugin);
};

//# sourceMappingURL=useSlatePlugin.js.map