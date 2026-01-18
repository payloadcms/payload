export const destroy = async function destroy() {
    await this.connection.close();
    for (const name of Object.keys(this.connection.models)){
        this.connection.deleteModel(name);
    }
};

//# sourceMappingURL=destroy.js.map