import {
  ACTION_TYPE_AFTER_DELETE_ENTITY,
  ACTION_TYPE_SET_ENTITIES,
  ACTION_TYPE_SET_ENTITIES_BUSY_INDICATION,
  ACTION_TYPE_SET_ENTITIES_ERROR,
  ACTION_TYPE_SET_ENTITIES_FILTER, ACTION_TYPE_SET_ENTITY_STATES,
  ACTION_TYPE_SET_SELECTED_ENTITY,
  ACTION_TYPE_SET_SELECTED_ENTITY_BUSY_INDICATION,
  ACTION_TYPE_SET_SELECTED_ENTITY_ERROR,
  ENTITY_STORE_STATUS_DELETED,
  ENTITY_STORE_STATUS_ERROR,
  ENTITY_STORE_STATUS_INITIAL,
  ENTITY_STORE_STATUS_LOADED,
  ENTITY_STORE_STATUS_SAVED
} from './constants';
import { EntityStoreState } from './models/EntityStoreState';
import { EntityState } from './models/EntityState';
import { EntityCollectionState } from './models/EntityCollectionState';
import { EntityStoreConfig } from './models/EntityStoreConfig';
import { defaultEntityConfig, EntityConfig } from './models/EntityConfig';

const initialState: EntityStoreState<any> = {
  selectedEntity: {
    status: ENTITY_STORE_STATUS_INITIAL,
    isBusy: false,
    entity: null,
    error: undefined
  },
  collection: {
    status: ENTITY_STORE_STATUS_INITIAL,
    isBusy: false,
    apiFilter: null,
    entityStates: [],
    totalEntities: 0,
    error: null
  }
};

export const createRestduxReducers = (entityStoreConfig: EntityStoreConfig) => {

  const reducers: any = {};

  for (const entityName of Object.keys(entityStoreConfig.entities)) {
    const storeKey = entityStoreConfig.entities[entityName].storeKey || entityName;
    reducers[storeKey] = createRestduxReducer(entityStoreConfig, entityName);
  }

  return reducers;

};

const createRestduxReducer = <T>(entityStoreConfig: EntityStoreConfig, entityName: string) => {

  return (state = initialState, action: { type: string, entityName: string, payload: any }) => {
    if (entityName !== action.entityName) {
      return state;
    }

    const entityConfig: EntityConfig = entityStoreConfig.entities[entityName];

    switch (action.type) {
      case ACTION_TYPE_SET_ENTITIES:
        return onSetEntities<T>(state, action.payload);
      case ACTION_TYPE_SET_ENTITY_STATES:
        return onSetEntityStates<T>(state, action.payload);
      case ACTION_TYPE_SET_ENTITIES_BUSY_INDICATION:
        return onSetEntitiesBusyIndication(state, action.payload);
      case ACTION_TYPE_SET_ENTITIES_FILTER:
        return onSetEntitiesFilter(state, action.payload);
      case ACTION_TYPE_SET_ENTITIES_ERROR:
        return onSetEntitiesError(state, action.payload);

      case ACTION_TYPE_SET_SELECTED_ENTITY:
        return onSetSelectedEntity<T>(entityConfig, state, action.payload);
      case ACTION_TYPE_SET_SELECTED_ENTITY_BUSY_INDICATION:
        return onSetSelectedEntityBusyIndication<T>(entityConfig, state, action.payload);
      case ACTION_TYPE_SET_SELECTED_ENTITY_ERROR:
        return onSetSelectedEntityError<T>(entityConfig, state, action.payload);
      case ACTION_TYPE_AFTER_DELETE_ENTITY:
        return onAfterDeleteEntity<T>(entityConfig, state, action.payload);
      default:
        return state;
    }
  }
};

// ==================================================================================================================
// === API response processing actions ==============================================================================
// ==================================================================================================================

const onSetEntities = <T>(state: any, payload: { entities: T[], totalEntities: number, status: string }) => {

  return {
    ...state,
    collection: {
      ...state.collection,
      isBusy: false,
      status: payload.status,
      entityStates: payload.entities.map(entity => {
        return {
          isBusy: false,
          status: payload.status,
          entity
        } as EntityState<T>;
      }),
      totalEntities: (payload.totalEntities) ? payload.totalEntities : payload.entities.length
    }
  };

};

const onSetEntityStates = <T>(state: any, payload: { entityStates: EntityState<T>[], totalEntities: number, status: string }) => {

  return {
    ...state,
    collection: {
      ...state.collection,
      isBusy: false,
      status: payload.status,
      entityStates: payload.entityStates,
      totalEntities: (payload.totalEntities) ? payload.totalEntities : payload.entityStates.length
    }
  };

};

const onSetEntitiesBusyIndication = (state: any, payload: { isBusy: boolean, status: string }) => {

  return {
    ...state,
    collection: {
      ...state.collection,
      isBusy: payload.isBusy,
      status: payload.status
    }
  };

};

const onSetEntitiesFilter = (state: any, payload: { apiFilter: any }) => {

  return {
    ...state,
    collection: {
      ...state.collection,
      apiFilter: payload.apiFilter
    }
  };

};

const onSetEntitiesError = (state: any, payload: {error: any}) => {

  return {
    ...state,
    collection: {
      ...state.collection,
      isBusy: false,
      status: ENTITY_STORE_STATUS_ERROR,
      error: payload.error
    }
  };

};

const onSetSelectedEntity = <T extends { [key: string]: any }>(entityConfig: EntityConfig, state: any, payload: { entity: T, status: string }) => {

  const keyProperty = entityConfig.keyProperty ? entityConfig.keyProperty : defaultEntityConfig.keyProperty;

  const updatedState = { ...state };

  const updatedEntityState: EntityState<T> = {
    isBusy: false,
    status: payload.status,
    entity: payload.entity,
    error: undefined
  };

  // We update selectedEntity only if we loaded it or if we saved it & keyProperty equals current id of selectedEntity
  // This is done because we should be able to save entities of the list separately from the "master" view
  if (
    payload.status === ENTITY_STORE_STATUS_LOADED ||
    (
      payload.status === ENTITY_STORE_STATUS_SAVED &&
      (!state.selectedEntity.entity || !state.selectedEntity.entity[keyProperty] || state.selectedEntity.entity[keyProperty] === payload.entity[keyProperty])
    )
  ) {
    updatedState.selectedEntity = updatedEntityState;
  }

  // Let's find our entity in collection and update it as well (if it's present)
  updatedState.collection = updateEntityStateInCollection<T>(entityConfig, state.collection, updatedEntityState);

  return updatedState;

};

const onSetSelectedEntityBusyIndication = <T>(entityConfig: EntityConfig, state: any, payload: { isBusy: boolean, status: string, key: any }) => {

  const updatedEntityState = {
    ...state.selectedEntity,
    isBusy: payload.isBusy,
    status: payload.status,
    error: null
  };

  return {
    ...state,
    selectedEntity: updatedEntityState,
    collection: updateEntityStateInCollection<T>(entityConfig, state.collection, updatedEntityState)
  };

};

const onSetSelectedEntityError = <T>(entityConfig: EntityConfig, state: any, payload: {error: any}) => {

  const updatedEntityState = {
    ...state.selectedEntity,
    isBusy: false,
    status: ENTITY_STORE_STATUS_ERROR,
    error: payload.error
  };

  return {
    ...state,
    selectedEntity: updatedEntityState,
    collection: updateEntityStateInCollection<T>(entityConfig, state.collection, updatedEntityState)
  };

};

const onAfterDeleteEntity = <T extends { [key: string]: any }>(entityConfig: EntityConfig, state: any, payload: { key: any }) => {

  console.log('onAfterDeleteEntity', payload);

  const keyProperty = entityConfig.keyProperty ? entityConfig.keyProperty : defaultEntityConfig.keyProperty;

  const updatedState = { ...state };

  const updatedEntityState = {
    ...state.selectedEntity,
    entity: null,
    isBusy: false,
    status: ENTITY_STORE_STATUS_DELETED,
    error: null
  };

  if (state.selectedEntity.entity && state.selectedEntity.entity[keyProperty] === payload.key) {
    updatedState.selectedEntity = updatedEntityState;
  }

  // Removing deleted entity from state.entityStates, if it's found there
  const existingEntityIndex = updatedState.collection.entityStates.findIndex(
    (entityState: EntityState<T>) => {
      return entityState.entity[keyProperty] === payload.key
    }
  );
  if (existingEntityIndex !== -1) {
    updatedState.collection.entityStates.splice(existingEntityIndex, 1);
  }

  return updatedState;

};

const updateEntityStateInCollection = <T extends { [key: string]: any }>(entityConfig: EntityConfig, collection: EntityCollectionState<T>, updatedEntityState: EntityState<T>): EntityCollectionState<T> => {

  const keyProperty = entityConfig.keyProperty ? entityConfig.keyProperty : defaultEntityConfig.keyProperty;

  if (updatedEntityState.entity && updatedEntityState.entity[keyProperty] && collection && collection.entityStates) {

    const existingEntityIndex = collection.entityStates.findIndex(
      entityState => entityState.entity[keyProperty] === updatedEntityState.entity[keyProperty]
    );

    if (existingEntityIndex !== -1) {
      const updatedCollection = { ...collection };
      collection.entityStates[existingEntityIndex] = updatedEntityState;
      return updatedCollection;
    }
  }

  return collection;
};
