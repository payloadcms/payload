import { i18n as Ii18n } from 'i18next';
import { Permissions } from '../../auth';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import { SanitizedGlobalConfig } from '../../globals/config/types';
export declare enum EntityType {
    collection = "collections",
    global = "globals"
}
export type EntityToGroup = {
    type: EntityType.collection;
    entity: SanitizedCollectionConfig;
} | {
    type: EntityType.global;
    entity: SanitizedGlobalConfig;
};
export type Group = {
    label: string;
    entities: EntityToGroup[];
};
export declare function groupNavItems(entities: EntityToGroup[], permissions: Permissions, i18n: Ii18n): Group[];
