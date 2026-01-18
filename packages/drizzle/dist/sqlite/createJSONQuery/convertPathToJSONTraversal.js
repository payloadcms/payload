export const convertPathToJSONTraversal = (incomingSegments)=>{
    const segments = [
        ...incomingSegments
    ];
    segments.shift();
    return segments.reduce((res, segment)=>{
        const formattedSegment = Number.isNaN(parseInt(segment)) ? `'${segment}'` : segment;
        return `${res}->>${formattedSegment}`;
    }, '');
};

//# sourceMappingURL=convertPathToJSONTraversal.js.map