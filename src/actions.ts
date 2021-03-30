import {
  ACTION_TYPE_AFTER_DELETE_ENTITY,
  ACTION_TYPE_SET_ENTITIES,
  ACTION_TYPE_SET_ENTITIES_BUSY_INDICATION,
  ACTION_TYPE_SET_ENTITIES_ERROR,
  ACTION_TYPE_SET_ENTITIES_FILTER, ACTION_TYPE_SET_ENTITY_STATES,
  ACTION_TYPE_SET_SELECTED_ENTITY,
  ACTION_TYPE_SET_SELECTED_ENTITY_BUSY_INDICATION,
  ACTION_TYPE_SET_SELECTED_ENTITY_ERROR,
  ENTITY_STORE_STATUS_DELETING,
  ENTITY_STORE_STATUS_LOADED,
  ENTITY_STORE_STATUS_LOADING,
  ENTITY_STORE_STATUS_SAVED,
  ENTITY_STORE_STATUS_SAVING,
  SUB_STORE_KEY_ENTITIES,
  SUB_STORE_KEY_SELECTED_ENTITY
} from './constants';
import {
  constructApiCall,
  deleteByKeyApiCall,
  findAllApiCall,
  findByKeyApiCall,
  saveApiCall
} from './apiCallFunctions';
import { EntityStoreConfig } from './models/EntityStoreConfig';
import { EntityStorePage } from './models/EntityStorePage';
import { EntityState } from './models';


// ================================================================================================================
// === Async actions ==============================================================================================
// ================================================================================================================

export const findAllAction = <T>(entityStoreConfig: EntityStoreConfig, entityName: string, apiFilter: any) => {

  return async dispatch => {

    dispatch(setEntitiesFilterAction(entityName, {apiFilter}));

    try {
      const entityStorePage: EntityStorePage<T> = await constructApiCall(
        dispatch,
        entityStoreConfig,
        entityName,
        SUB_STORE_KEY_ENTITIES,
        findAllApiCall(entityStoreConfig, entityName, apiFilter),
        ENTITY_STORE_STATUS_LOADING
      );

      if (entityStorePage) {
        dispatch(setEntitiesAction<T>(entityName, {
          entities: entityStorePage.entities,
          totalEntities: entityStorePage.totalEntities,
          status: ENTITY_STORE_STATUS_LOADED
        }));
      }
    } catch (error) {
      // All of the error handling is done inside the API call function
    }

  };
};

export const findByKeyAction = <T>(entityStoreConfig: EntityStoreConfig, entityName: string, key: number | string) => {

  return async dispatch => {

    try {
      const entity = await constructApiCall(
        dispatch,
        entityStoreConfig,
        entityName,
        SUB_STORE_KEY_SELECTED_ENTITY,
        findByKeyApiCall(entityStoreConfig, entityName, key),
        ENTITY_STORE_STATUS_LOADING,
      );

      dispatch(setSelectedEntityAction<T>(entityName, {
        entity,
        status: ENTITY_STORE_STATUS_LOADED
      }));
    } catch (error) {
      // All of the error handling is done inside the API call function
    }

  }
};

export const saveAction = <T>(entityStoreConfig: EntityStoreConfig, entityName: string, entity: T) => {

  return async dispatch => {

    try {
      entity = await constructApiCall(
        dispatch,
        entityStoreConfig,
        entityName,
        SUB_STORE_KEY_SELECTED_ENTITY,
        saveApiCall(entityStoreConfig, entityName, entity),
        ENTITY_STORE_STATUS_SAVING
      );

      if (entity) {
        dispatch(setSelectedEntityAction<T>(entityName, {
          entity,
          status: ENTITY_STORE_STATUS_SAVED
        }));
      }
    } catch (error) {
      // All of the error handling is done inside the API call function
    }

  };

};

export const deleteByKeyAction = <T>(entityStoreConfig: EntityStoreConfig, entityName: string, key: any) => {

  return async dispatch => {

    try {
      await constructApiCall(
        dispatch,
        entityStoreConfig,
        entityName,
        SUB_STORE_KEY_SELECTED_ENTITY,
        deleteByKeyApiCall(entityStoreConfig, entityName, key),
        ENTITY_STORE_STATUS_DELETING
      );

      dispatch(afterDeleteEntityAction<T>(entityName, {key}));
    } catch (error) {
      // All of the error handling is done inside the API call function
    }

  };

};

// ================================================================================================================
// === State modification actions =================================================================================
// ================================================================================================================

export const setEntitiesAction = <T>(
  entityName: string,
  payload: {entities: T[], totalEntities: number, status: string} = {
    entities: [],
    totalEntities: 0,
    status: ENTITY_STORE_STATUS_LOADED
  }
) => {

  if (!payload.entities) { payload.entities = [] }
  if (!payload.totalEntities) { payload.totalEntities = payload.entities.length }
  if (!payload.status) { payload.status = ENTITY_STORE_STATUS_LOADED }

  return {
    type: ACTION_TYPE_SET_ENTITIES,
    entityName,
    payload
  };
};

export const setEntityStatesAction = <T>(
  entityName: string,
  payload: {entityStates: EntityState<T>[], totalEntities: number, status: string} = {
    entityStates: [],
    totalEntities: 0,
    status: ENTITY_STORE_STATUS_LOADED
  }
) => {

  if (!payload.entityStates) { payload.entityStates = [] }
  if (!payload.totalEntities) { payload.totalEntities = payload.entityStates.length }
  if (!payload.status) { payload.status = ENTITY_STORE_STATUS_LOADED }

  return {
    type: ACTION_TYPE_SET_ENTITY_STATES,
    entityName,
    payload
  };
};


export const setEntitiesBusyIndicationAction = (entityName: string, payload: {isBusy: boolean, status: string}) => {
  return {
    type: ACTION_TYPE_SET_ENTITIES_BUSY_INDICATION,
    entityName,
    payload
  };
};

export const setEntitiesErrorAction = (entityName: string, payload: {error: any}) => {
  return {
    type: ACTION_TYPE_SET_ENTITIES_ERROR,
    entityName,
    payload
  };
};

export const setEntitiesFilterAction = (entityName: string, payload: {apiFilter: any}) => {
  return {
    type: ACTION_TYPE_SET_ENTITIES_FILTER,
    entityName,
    payload
  };
};

export const setSelectedEntityAction = <T>(entityName: string, payload: {entity: T, status: string}) => {
  return {
    type: ACTION_TYPE_SET_SELECTED_ENTITY,
    entityName,
    payload
  };
};

export const setSelectedEntityBusyIndicationAction = (entityName: string, payload: {isBusy: boolean, status: string}) => {
  return {
    type: ACTION_TYPE_SET_SELECTED_ENTITY_BUSY_INDICATION,
    entityName,
    payload
  };
};

export const setSelectedEntityErrorAction = (entityName: string, payload: {error: any}) => {
  return {
    type: ACTION_TYPE_SET_SELECTED_ENTITY_ERROR,
    entityName,
    payload
  };
};

export const afterDeleteEntityAction = <T>(entityName: string, payload: {key: any}) => {
  return {
    type: ACTION_TYPE_AFTER_DELETE_ENTITY,
    entityName,
    payload
  };
};
