import { EntityState } from './EntityState';

export class EntityCollectionState<T> {
  status: string;
  isBusy: boolean;
  apiFilter: any;
  entityStates: EntityState<T>[];
  totalEntities: number;
  error?: any;
}

