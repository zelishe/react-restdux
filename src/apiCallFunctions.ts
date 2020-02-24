import { SUB_STORE_KEY_ENTITIES, SUB_STORE_KEY_SELECTED_ENTITY } from './constants';
import {
  setEntitiesBusyIndicationAction,
  setEntitiesErrorAction,
  setSelectedEntityBusyIndicationAction,
  setSelectedEntityErrorAction
} from './actions';
import { EntityStorePage } from './models/EntityStorePage';
import { EntityStoreConfig } from './models/EntityStoreConfig';
import { AxiosInstance } from 'axios';

import * as qs from 'qs';

const collectionParseErrorMessage = '[Restdux][EntityCrudService] Could not parse http response. Define or update parseCollectionHttpResponse in entityStoreConfig, please';
const entityParseErrorMessage     = '[Restdux][EntityCrudService] Could not parse http response. Define or update parseEntityHttpResponse in entityStoreConfig, please';

const processEntityHttpResponse = <T>(entityStoreConfig: EntityStoreConfig, initialHttpResponse: any, params: any): T => {

  const entity = entityStoreConfig.parseEntityHttpResponse(initialHttpResponse, params);

  if (!entity) {
    onError(entityParseErrorMessage);
  }

  return entity;

};

const getApiEndpoint = (entityStoreConfig: EntityStoreConfig, entityName: string) =>
  `${entityStoreConfig.apiUrl}/${entityStoreConfig.entities[entityName].apiPath}`;

const getQueryString = (query: any = null) => {
  const queryString = qs.stringify(query);
  return ((queryString !== '') ? '?' : '') + queryString;
};

const onError = (error: any) => {
  throw new Error(error);
};

const getAxiosInstance = (entityStoreConfig: EntityStoreConfig): AxiosInstance => {
  if (!entityStoreConfig.axios) {
    throw new Error('No axios instance was provided in entityStoreConfig');
  }

  return entityStoreConfig.axios;
};

export const findAllApiCall = async <T>(entityStoreConfig: EntityStoreConfig, entityName: string, filter: any = null) => {

  try {

    const httpResponse = await getAxiosInstance(entityStoreConfig).get(`${getApiEndpoint(entityStoreConfig, entityName)}${getQueryString(filter)}`);
    const entityStorePage: EntityStorePage<T> = entityStoreConfig.parseCollectionHttpResponse(httpResponse, { filter });

    if (!entityStorePage || !entityStorePage.entities || !entityStorePage.totalEntities) {
      throw new Error(collectionParseErrorMessage);
    }

    return entityStorePage;
  } catch (error) {
    return onError(error);
  }

};

export const findByKeyApiCall = async <T>(entityStoreConfig: EntityStoreConfig, entityName: string, key: number | string) => {

  try {
    const httpResponse = await getAxiosInstance(entityStoreConfig).get(`${getApiEndpoint(entityStoreConfig, entityName)}/${key}`);
    return processEntityHttpResponse<T>(entityStoreConfig, httpResponse, { key });
  } catch (error) {
    return onError(error);
  }

};

export const saveApiCall = async <T extends { [key: string]: any }>(entityStoreConfig: EntityStoreConfig, entityName: string, entity: T) => {

  let httpResponse;

  try {
    if (entity['id']) {
      httpResponse = await getAxiosInstance(entityStoreConfig).put(`${getApiEndpoint(entityStoreConfig, entityName)}/${entity['id']}`, entity);
    } else {
      httpResponse = await getAxiosInstance(entityStoreConfig).post(`${getApiEndpoint(entityStoreConfig, entityName)}`, entity);
    }

    return processEntityHttpResponse<T>(entityStoreConfig, httpResponse, { entity });

  } catch (error) {
    return onError(error);
  }

};

export const deleteByKeyApiCall = async <T extends { [key: string]: any }>(entityStoreConfig: EntityStoreConfig, entityName: string, key: any) => {

  try {
    const httpResponse = await getAxiosInstance(entityStoreConfig).delete(`${getApiEndpoint(entityStoreConfig, entityName)}/${key}`);
    return processEntityHttpResponse<T>(entityStoreConfig, httpResponse, { key });
  } catch (err) {
    return onError(err);
  }

};

export const constructApiCall = async (
  dispatch,
  entityStoreConfig: EntityStoreConfig,
  entityName: string,
  subStoreKey: string,
  apiCallFunction: any,
  busyStatus: string
) => {

  let setBusyIndicationAction: any;
  let setErrorAction: any;

  switch (subStoreKey) {
    case SUB_STORE_KEY_ENTITIES:
      setBusyIndicationAction = setEntitiesBusyIndicationAction;
      setErrorAction          = setEntitiesErrorAction;
      break;
    case SUB_STORE_KEY_SELECTED_ENTITY:
      setBusyIndicationAction = setSelectedEntityBusyIndicationAction;
      setErrorAction          = setSelectedEntityErrorAction;
      break;
  }

  const busyIndicationTimeout = setTimeout(() => {
    dispatch(setBusyIndicationAction(entityName, { isBusy: true, status: busyStatus }));
  }, entityStoreConfig.busyIndicationDelay);

  try {
    const result = await apiCallFunction;
    clearTimeout(busyIndicationTimeout);
    return result;
  } catch (error) {
    clearTimeout(busyIndicationTimeout);
    dispatch(setErrorAction(entityName, { error }));
  }

};

