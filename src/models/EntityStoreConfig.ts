import { AxiosInstance } from 'axios';
import { EntityConfig } from './EntityConfig';

export class EntityStoreConfig {
  axios?: AxiosInstance;
  apiUrl: string;
  busyIndicationDelay?: number;
  entities: { [key: string]: EntityConfig };

  parseCollectionHttpResponse?: any;
  parseEntityHttpResponse?: any;
}

export const defaultEntityStoreConfig: EntityStoreConfig = {
  busyIndicationDelay: 300,
  apiUrl: '',
  entities: {},

  parseCollectionHttpResponse(httpResponse: any) {
    return httpResponse.data;
  },

  parseEntityHttpResponse(httpResponse: any) {
    return httpResponse.data;
  }

};
