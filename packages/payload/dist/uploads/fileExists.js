import fs from 'fs/promises';
export const fileExists = async (filename)=>{
    try {
        await fs.stat(filename);
        return true;
    } catch (ignore) {
        return false;
    }
};

//# sourceMappingURL=fileExists.js.map