export class EntityState<T> {
  status: string;
  isBusy: boolean;
  entity: T;
  error?: object;
}
