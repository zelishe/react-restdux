import { defaultEntityStoreConfig, EntityStoreConfig } from './models/EntityStoreConfig';
import { defaultEntityConfig } from './models/EntityConfig';
import {
  deleteByKeyAction,
  findAllAction,
  findByKeyAction,
  saveAction,
  setEntitiesAction,
  setSelectedEntityAction
} from './actions';
import { useDispatch, useSelector } from 'react-redux';
import { EntityState } from './models/EntityState';
import { EntityCollectionState } from './models/EntityCollectionState';
import { ENTITY_STORE_STATUS_LOADED } from './constants';

export const useRestdux = <T>(entityStoreConfig: EntityStoreConfig, entityName: string) => {

  // Let's update our entityStoreConfig and entityConfig with the default values
  entityStoreConfig = {
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

  const storeKey = entityStoreConfig.entities[entityName].storeKey || entityName;
  const dispatch = useDispatch();

  return {
    selectedEntity: useSelector((store: any): T => store[storeKey].selectedEntity.entity) as T,
    selectedEntityState: useSelector((store: any) => store[storeKey].selectedEntity) as EntityState<T>,
    selectedEntityIsBusy: useSelector((store: any) => store[storeKey].selectedEntity.isBusy) as boolean,
    selectedEntityStatus: useSelector((store: any) => store[storeKey].selectedEntity.status) as string,
    selectedEntityError: useSelector((store: any) => store[storeKey].selectedEntity.error) as any,

    entities: useSelector((store: any) => store[storeKey].collection.entityStates.map((entityState: EntityState<T>) => entityState.entity)) as T[],
    entityStates: useSelector((store: any) => store[storeKey].collection.entityStates) as EntityState<T>[],
    collection: useSelector((store: any) => store[storeKey].collection) as EntityCollectionState<T>,
    totalEntities: useSelector((store: any) => store[storeKey].collection.totalEntities) as number,
    collectionIsBusy: useSelector((store: any) => store[storeKey].collection.isBusy) as boolean,
    collectionStatus: useSelector((store: any) => store[storeKey].collection.status) as string,
    collectionError: useSelector((store: any) => store[storeKey].collection.error) as any,

    setSelectedEntity(entity: T, status: string = ENTITY_STORE_STATUS_LOADED) {
      dispatch(setSelectedEntityAction<T>(entityName, { entity, status }))
    },
    setEntities(entities: T[] = [], status: string = ENTITY_STORE_STATUS_LOADED) {
      dispatch(setEntitiesAction<T>(entityName, {
        entities,
        totalEntities: entities.length,
        status
      }))
    },
    findAll(apiFilter?: any) {
      dispatch(findAllAction<T>(entityStoreConfig, entityName, apiFilter));
    },
    findByKey(key: any) {
      dispatch(findByKeyAction<T>(entityStoreConfig, entityName, key))
    },
    save(entity: T) {
      dispatch(saveAction<T>(entityStoreConfig, entityName, entity));
    },
    deleteByKey(key: any) {
      dispatch(deleteByKeyAction<T>(entityStoreConfig, entityName, key));
    }

  }


};
