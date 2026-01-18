// eslint-disable-next-line @typescript-eslint/require-await
export const destroy = async function destroy() {
    if (this.enums) {
        this.enums = {};
    }
    this.schema = {};
    this.tables = {};
    this.relations = {};
    this.fieldConstraints = {};
    this.drizzle = undefined;
    this.initializing = new Promise((res, rej)=>{
        this.resolveInitializing = res;
        this.rejectInitializing = rej;
    });
};

//# sourceMappingURL=destroy.js.map