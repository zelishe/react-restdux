import { EntityState } from './EntityState';
import { EntityCollectionState } from './EntityCollectionState';

export class EntityStoreState<T> {

  selectedEntity: EntityState<T>;
  collection: EntityCollectionState<T>;

}
