export type Row = {
    id: string;
    collapsed?: boolean;
    blockType?: string;
};
type SET_ALL = {
    type: 'SET_ALL';
    data: {
        id?: string;
        blockType?: string;
    }[];
    collapsedState?: string[];
    blockType?: string;
    initCollapsed?: boolean;
};
type SET_COLLAPSE = {
    type: 'SET_COLLAPSE';
    id: string;
    collapsed: boolean;
};
type SET_ALL_COLLAPSED = {
    type: 'SET_ALL_COLLAPSED';
    collapse: boolean;
};
type ADD = {
    type: 'ADD';
    rowIndex: number;
    blockType?: string;
};
type REMOVE = {
    type: 'REMOVE';
    rowIndex: number;
};
type MOVE = {
    type: 'MOVE';
    moveFromIndex: number;
    moveToIndex: number;
};
type Action = SET_ALL | SET_COLLAPSE | SET_ALL_COLLAPSED | ADD | REMOVE | MOVE;
declare const reducer: (currentState: Row[], action: Action) => Row[];
export default reducer;
