import { Main } from './main.js';
import { error } from './utils/log.js';
export async function main() {
    try {
        await new Main().init();
    } catch (e) {
        if (e instanceof Error) {
            error(e.message);
        }
    }
}

//# sourceMappingURL=index.js.map