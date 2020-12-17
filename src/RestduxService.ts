import {
  defaultEntityConfig,
  defaultEntityStoreConfig,
  EntityCollectionState,
  EntityState,
  EntityStoreConfig
} from './models';
import {
  deleteByKeyAction,
  findAllAction,
  findByKeyAction,
  saveAction,
  setEntitiesAction, setEntitiesFilterAction,
  setSelectedEntityAction
} from './actions';
import { ENTITY_STORE_STATUS_LOADED } from './constants';

export class RestduxService<T> {

  store: any;
  entityStoreConfig: EntityStoreConfig;
  entityName: string;

  storeKey: string;
  dispatch;

  constructor(
    store: any,
    entityStoreConfig: EntityStoreConfig,
    entityName: string
  ) {

    this.store = store;

    this.entityStoreConfig = {
      ...defaultEntityStoreConfig,
      ...entityStoreConfig,
      entities: {
        ...entityStoreConfig.entities,
        [entityName]: {
          ...defaultEntityConfig,
          ...entityStoreConfig.entities[entityName]
        }
      }
    };

    this.entityName = entityName;
    this.storeKey = this.entityStoreConfig.entities[entityName].storeKey || entityName;
  }

  selectedEntity = (store: any) => store[this.storeKey].selectedEntity.entity as T;
  selectedEntityState = (store: any) => store[this.storeKey].selectedEntity as EntityState<T>;
  selectedEntityIsBusy = (store: any) => store[this.storeKey].selectedEntity.isBusy as boolean;
  selectedEntityStatus = (store: any) => store[this.storeKey].selectedEntity.status as string;
  selectedEntityError = (store: any) => store[this.storeKey].selectedEntity.error as any;

  entities = (store: any) => store[this.storeKey].collection.entityStates.map((entityState: EntityState<T>) => entityState.entity) as T[];
  entityStates = (store: any) => store[this.storeKey].collection.entityStates as EntityState<T>[];
  apiFilter = (store: any) => store[this.storeKey].collection.apiFilter as any;
  collection = (store: any) => store[this.storeKey].collection as EntityCollectionState<T>;
  totalEntities = (store: any) => store[this.storeKey].collection.totalEntities as number;
  collectionIsBusy = (store: any) => store[this.storeKey].collection.isBusy as boolean;
  collectionStatus = (store: any) => store[this.storeKey].collection.status as string;
  collectionError = (store: any) => store[this.storeKey].collection.error as any;

  setFilter(apiFilter: any) {
    this.store.dispatch(setEntitiesFilterAction(this.entityName, { apiFilter }));
  }

  setSelectedEntity(entity: T, status: string = ENTITY_STORE_STATUS_LOADED) {
    this.store.dispatch(setSelectedEntityAction<T>(this.entityName, { entity, status }))
  }

  setEntities(entities?: T[], status: string = ENTITY_STORE_STATUS_LOADED) {
    this.store.dispatch(setEntitiesAction<T>(this.entityName, {
      entities,
      totalEntities: entities.length,
      status
    }))
  }

  findAll(apiFilter?: object) {
    this.store.dispatch(findAllAction<T>(this.entityStoreConfig, this.entityName, apiFilter) as any);
  }

  findByKey(key: number | string) {
    this.store.dispatch(findByKeyAction<T>(this.entityStoreConfig, this.entityName, key) as any)
  }

  save(entity: T) {
    this.store.dispatch(saveAction<T>(this.entityStoreConfig, this.entityName, entity) as any);
  }

  deleteByKey(key: any) {
    this.store.dispatch(deleteByKeyAction<T>(this.entityStoreConfig, this.entityName, key) as any);
  }

}


