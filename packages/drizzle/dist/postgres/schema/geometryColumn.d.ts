type Point = [number, number];
export declare const geometryColumn: (name: string) => import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
    name: string;
    dataType: "custom";
    columnType: "PgCustomColumn";
    data: Point;
    driverParam: string;
    enumValues: undefined;
}>;
export {};
//# sourceMappingURL=geometryColumn.d.ts.map