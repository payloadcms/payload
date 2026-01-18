import { QueryComplexity } from './QueryComplexity.js';
export function createComplexityRule(options) {
    return (context)=>{
        return new QueryComplexity(context, options);
    };
}

//# sourceMappingURL=createComplexityRule.js.map