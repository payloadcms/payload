/**
 * Generates a filename based on current date and time.
 * Format: "YYYY-MM-DD HH:MM:SS"
 */ export const getFilename = ()=>{
    const now = new Date();
    const yyymmdd = now.toISOString().split('T')[0] // "YYYY-MM-DD"
    ;
    const hhmmss = now.toTimeString().split(' ')[0] // "HH:MM:SS"
    ;
    return `${yyymmdd} ${hhmmss}`;
};

//# sourceMappingURL=getFilename.js.map