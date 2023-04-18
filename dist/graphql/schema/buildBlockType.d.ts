import { Payload } from '../../payload';
import { Block } from '../../fields/config/types';
type Args = {
    payload: Payload;
    block: Block;
    forceNullable?: boolean;
};
declare function buildBlockType({ payload, block, forceNullable, }: Args): void;
export default buildBlockType;
