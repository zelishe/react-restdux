export class EntityConfig {
  entityName?: string;
  apiPath?: string;
  storeKey?: string;
  keyProperty?: string;
}

export const defaultEntityConfig: EntityConfig = {
  keyProperty: 'id'
};
