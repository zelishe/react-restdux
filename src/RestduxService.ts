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
  setEntitiesAction,
  setSelectedEntityAction
} from './actions';
import { ENTITY_STORE_STATUS_LOADED } from './constants';
import { Store } from 'redux';
import { shallowEqual, useSelector } from 'react-redux';

export class RestduxService<T> {

  store: Store;
  entityStoreConfig: EntityStoreConfig;
  entityName: string;

  storeKey: string;
  dispatch;

  constructor(
    store: Store,
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
  selectedEntityState = useSelector((store: any) => store[this.storeKey].selectedEntity) as EntityState<T>;
  selectedEntityIsBusy = useSelector((store: any) => store[this.storeKey].selectedEntity.isBusy) as boolean;
  selectedEntityStatus = useSelector((store: any) => store[this.storeKey].selectedEntity.status) as string;
  selectedEntityError = useSelector((store: any) => store[this.storeKey].selectedEntity.error) as any;

  entities = useSelector((store: any) => store[this.storeKey].collection.entityStates.map((entityState: EntityState<T>) => entityState.entity), shallowEqual) as T[];
  entityStates = useSelector((store: any) => store[this.storeKey].collection.entityStates) as EntityState<T>[];
  collection = useSelector((store: any) => store[this.storeKey].collection) as EntityCollectionState<T>;
  totalEntities = useSelector((store: any) => store[this.storeKey].collection.totalEntities) as number;
  collectionIsBusy = useSelector((store: any) => store[this.storeKey].collection.isBusy) as boolean;
  collectionStatus = useSelector((store: any) => store[this.storeKey].collection.status) as string;
  collectionError = useSelector((store: any) => store[this.storeKey].collection.error) as any;

  setSelectedEntity(entity: T, status: string = ENTITY_STORE_STATUS_LOADED) {
    this.store.dispatch(setSelectedEntityAction<T>(this.entityName, { entity, status }))
  }

  setEntities(entities: T[] = [], status: string = ENTITY_STORE_STATUS_LOADED) {
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


