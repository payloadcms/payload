export type Groups = 'addColumn' | 'addConstraint' | 'alterType' | 'createIndex' | 'createTable' | 'createType' | 'disableRowSecurity' | 'dropColumn' | 'dropConstraint' | 'dropIndex' | 'dropTable' | 'dropType' | 'notNull' | 'renameColumn' | 'setDefault';
export declare const groupUpSQLStatements: (list: string[]) => Record<Groups, string[]>;
//# sourceMappingURL=groupUpSQLStatements.d.ts.map