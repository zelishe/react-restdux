# React Restdux

A practical REST API data store for React and Redux

* [Features](#Features)
* [Installation](#Installation)
* [Quickstart](#Quickstart)
* [Entity store structure](#EntityStoreStructure)
* [Dispatching requests to backend API](#DispatchingRequestsToBackendApi)
* [Configuration in details](#ConfigurationInDetails)

## <a id="Features"></a> Features

- Advanced REST API call status indication (loading, loaded, saving, saved, deleting, deleted) to give you full control over the data transfer process
- Simplified REST API call status via isBusy store property for those, who need a simplified solution
- Separated (but synchronized) state for the collection and the selected entity
- Separated status states for each entity in the collection
- totalElements for the collection to make your pagination easy
- apiFilter state to keep your filter form in a good shape 
- Easy API response post-processing - any response from your backend is acceptable 

## <a id="Installation"></a> Installation

#### npm
```shell script
    npm i --save react-restdux
```

#### yarn
```shell script
    yarn add react-restdux
```

## <a id="Quickstart"></a> Quickstart

Create a class for your entity. This class properties have to match the response from your API. For example, let's create a simple entity class for a Person 

```typescript
export class Person {
  id: number;
  firstName: string;
  lastName: string;
}
```

Create a basic configuration for Restdux, including EntityConfig for the Person.

1. You need to provide an Axios instance, where you can add required interceptors for authentication, header handling, etc.
2. You need to define parseCollectionHttpResponse to parse your backend response for the list of entities
3. You need to define parseEntityHttpResponse to parse your backend response for one entity
4. If storeKey is not set, then the entity key is used instead (Person in the example case)

```typescript
import yourAxiosInstance from './AxiosInstance';
import { EntityStoreConfig } from 'react-restdux';
import { EntityStorePage } from 'react-restdux';

const entityStoreConfig: EntityStoreConfig = {
  axios: yourAxiosInstance,
  apiUrl: 'http://your-api-url.com/api',
  entities: {
    Person: {
      storeKey: 'persons',
      apiPath: 'persons'
    }
  },
  parseCollectionHttpResponse(httpResponse: any, params: any): EntityStorePage<object> {
    return {
      entities: httpResponse.data['content'],
      totalEntities: httpResponse.data['totalElements']
    };
  },
  parseEntityHttpResponse(httpResponse: any, params: any) {
    return httpResponse.data;
  }
};

export default restduxStoreConfig;
```  

Combine Restdux reducers with your Redux store

```typescript
import restduxStoreConfig from 'restduxStoreConfig';
import { createRestduxReducers } from 'react-restdux';

export default combineReducers({
  myReducer1: myReducer1,
  ...createRestduxReducers(restduxStoreConfig)
});
```

Now you can start using the useRestdux hook in your react application 

```typescript
import React from 'react';
import restduxStoreConfig from './restduxStoreConfig';
import { RestduxService } from 'react-restdux';
import { Person } from './Person'; 
import { useSelector } from 'react-redux';
import store from '../redux/store';

export default function PersonView() {

    const personService = new RestduxService<Person>(store, restduxStoreConfig, 'Person');
    
    // Use a Redux selector to access the loaded entity 
    const person = useSelector(personService.selectedEntity);

    // Request Restdux to load Person with id=1
    personService.findByKey(1);   

    // This will output a div with person ID in it    
    return (
      <div>{person && person.id}</div>
    )

}
```

## <a id="EntityStoreStructure"></a> Entity store structure

Each entity store is put as a root element into the global Redux state under storeKey put into EntityConfig object.
In our case, it is "store.persons" of EntityStoreState type.

#### EntityStoreState

**selectedEntity** : EntityState

This is where the result of *single* entity API calls (such as findByKey, save or deleteByKey) go to

**collection** : EntityCollectionState

This is where the result of *collection* API calls (such as getAll) go to

---
#### EntityCollectionState

**status** : string (values = 'initial', 'loading', 'loaded', 'error')

The current status of collection. No batch save functionality for now on.

**isBusy** : boolean

Simplified status of the collection. This will be used, when we will add batch save and delete.

**apiFilter** : any

When you request getAll(filter) with some filter, this object will be stored in this part of the state. It is useful to manipulate your filter form, for example.

**entityStates** : EntityState<T>[];

Each entity in the collection has it's own separate state, stored in this array. Access to entities themselves is done through this array as well. 

**totalEntities** : number

Amount of **total** entities in the collection on the backend. This can be used for pagination.

**error** : any

Any errors returned from backed API will be stored here. API response with an error will switch collection to "not-busy, has an error" (isBusy: false, status: 'error'). 
You can enable a filter form in case of an error, for example.

---

#### EntityState

**status** : string (values = 'initial', 'loading', 'loaded', 'saving', 'saved', 'deleting', 'deleted', 'error')

The current status of the entity. You have very strong control over what state the entity is in, as you see.

**isBusy** : boolean

Simplified status of an entity. Reacts on get, save and delete.

**entity** : T

The actual entity data provided in service type T.

**error** : any

Any errors returned from backed API will be stored here. API response with an error will switch collection to "not-busy, has an error" (isBusy: false, status: 'error'). 
You can enable the entity edit form in case of an error, for example.

## <a id="DispatchingRequestsToBackendApi"></a> Dispatching requests to backend API

### Sending and receiving data from/to the backend

Each of your entity services have the following methods to request data manipulations.

**findAll(filter: any)** 

Request: GET + {apiUr}l/{apiPath}?filterParam1=x&filterParam2=y 

This method retrieves collection data from the backend API

 - After busyIndicationDelay has passed and if data has not yet arrived entityStoreState.collection switches to { isBusy: true, status: 'loading' }
 - Server response is processed by parseCollectionHttpResponse
 - Server response is put into updates the "collection.entityStates" part of the appropriate EntityStoreState.
 - Each entityState has { isBusy: false, status: 'loaded' }
 - Total amount of entities is put into "collections.totalEntities" or the appropriate EntityStoreState.
 - entityStoreState.collection switches to { isBusy: false, status: 'loaded' }

**findByKey(key: any)**

Request: GET + {apiUrl}/{apiPath}/{key} 

This method retrieves one entity by it's key (usually it's "id") from the backend.

 - After busyIndicationDelay has passed and if data has not yet arrived entityStoreState.selectedEntity switches to { isBusy: true, status: 'loading' }
 - Server response is processed by parseEntityHttpResponse
 - Server response is put into updates the "selectedEntity" part of the appropriate EntityStoreState.
 - selectedEntity is switched to { isBusy: false, status: 'loaded' }
 - **IMPORTANT** if this entity is present in the "collection" part of the state, it will be updated there as well, including a switch to 'loading' status
 - **IMPORTANT** if this entity is NOT present in collection part of the state, it will not be added to collection

**save(entity: T)**

Request: POST + {apiUrl}/{apiPath} 
Request: PUT + {apiUrl}/{apiPath}/{key}

This method sends POST or PUT request to save entity data on the backend

 - After busyIndicationDelay has passed and if data has not yet arrived entityStoreState.selectedEntity switches to { isBusy: true, status: 'saving' }
 - Server response is processed by parseEntityHttpResponse
 - Server response is put into updates the "selectedEntity" part of the appropriate EntityStoreState.
 - selectedEntity is switched to { isBusy: false, status: 'saved' }
 - **IMPORTANT** if this entity is present in collection part of the state, it will be updated there as well, including a switch to 'saving' status
 - **IMPORTANT** if this entity is NOT present in collection part of the state, it's not added to collection

**deleteByKey(key: any)**

Request: DELETE + {apiUrl}/{apiPath}/{key}

 - After busyIndicationDelay has passed and if data has not yet arrived entityStoreState.selectedEntity switches to { isBusy: true, status: 'deleting' }
 - Server response is processed by parseEntityHttpResponse
 - Server response is put into updates the "selectedEntity" part of the appropriate EntityStoreState.
 - selectedEntity is switched to { isBusy: false, status: 'saved' }
 - **IMPORTANT** If this entity is present in "collection" part of the state, it will be removed from there as well. That entity state will also switch to 'deleting' status, when appropriate event will be fired.

**setEntities(entities: T[], status: string = 'loaded')**

This method sets the entities collection, including the totalElements to whatever is provided in entities parameter. It is useful to set the collection state without making an API request.

**setEntityStates(entityStates: EntityState<T>[], status: string = 'loaded')**

This method sets the entity states collection "as is", including the totalElements to whatever is provided in entities parameter. It is useful to set the collection state without making an API request. It is useful to mass-add new elements which status differs from the rest of the collection (newly added "processing" items, for example).

**setSelectedEntity(entity: T, status: string = 'loaded')**

This method sets the selected entity of current redux slice. It is useful for setting the selected entity without making an API request. 

**setFilter(apiFilter: any)**

This method sets the apiFilter part of the current slice. It does not load any data from API. 

### Displaying the data

You can use the following properties from RexduxService. They can be used with useSelector() hook from react-redux.

```typescript
import { useSelector } from 'react-redux'; 
import { RestduxService } from './RestduxService';
import store from '../redux/store'

const personService = new RestduxService<Person>(store, restduxStoreConfig, 'Person');
const person = useSelector(personService.selectedEntity);
``` 

#### selectedEntity

**selectedEntity** : T 

Shortcut to ``store.yourEntityStore.selectedEntity.entity`` 

The main observable you'll be working with, it emits the entity you've requested to load, save or delete.

**selectedEntityState** : EntityState

Shortcut to ``store.yourEntityStore.selectedEntity`` 

Use it, if you need access to "everything about the entity".

**selectedEntityIsBusy** : boolean

Shortcut to ``store.yourEntityStore.selectedEntity.isBusy`` 

Use it, if you need to create a simple loading indication.

**selectedEntityStatus** : string

Shortcut to ``store.yourEntityStore.selectedEntity.status`` 

Use it, if you need to create a separated loading indication for load/save statuses. 

**selectedEntityError** : any 

Shortcut to ``store.yourEntityStore.selectedEntity.error`` 

Use it, if you need to unlock the entity edit form on backend error and provide some error indication.

---

#### collection

**entities** : T[] 

Shortcut to ``store.yourEntityStore.collection.entityStates.map(entityState => entityState.entity)`` 

The main observable you'll be working with, this is a shortcut with all the entities in the collection.

**entityStates** : EntityState[] 

Shortcut to ``store.yourEntityStore.collection.entitityStates`` 

Use it, if you need the access to "everything about the collection entities states". Useful, if you have a table of entities and want to save (and show the indication) one of those.

**collection** : EntityCollectionState

Shortcut to ``store.yourEntityStore.collection`` 

Use it, if you need the access to "everything about the collection"

**totalEntities** : number

Shortcut to ``store.yourEntityStore.collection.totalEntities`` 

Use it, if you need to put "total records found" number on your component. 

**collectionIsBusy** : boolean

Shortcut to ``store.yourEnityStore.collection.isBusy`` 

Use it, if you need to create a simple collection loading animation.

**collectionStatus** : string

Shortcut to ``store.yourEntityStore.collection.status`` 

Use it, if you need to create a separated loading indication for load/save statuses.

**collectionError** : any

Shortcut to ``store.youEntityStore.collection.error`` 

Use it, if you need to unlock the entity edit form on backend error and provide some error indication.

--- 

You can access any part of the state by using the usual react-redux useSelector hook.

```typescript
    const personEntityStates     = useSelector(store => store.persons.collection.entityStates);
    const personCollectionStatus = useSelector(store => store.persons.collection.status);
```

## <a id="ConfigurationInDetails"></a> Configuration in details

#### EntityStoreConfig

**axios** : AxiosInstance

Restdux uses Axios to access your backend API, that's why an instance of it needs to be supplied in configuration.
All authentication or header manipulations must be done in that instance, Restdux is not responsible for such things. 

**apiUrl** : string

The root URL to access your backend REST API. Entity resources will be accessed via {apiUrl}/{apiPath}, where apiPath is a property of EntityConfig

**busyIndicationDelay** : number = 300

**entities** : object

The keys of this object must match your model class names (Order, Person, etc.) and the value is an EntityConfig, providing all the information on how to manage this entity.

**parseCollectionHttpResponse** : function(httpResponse: any, params: any)

This function takes raw HttpResponse object directly from Axios and must provide an EntityPage instead.
In most of the real-world cases, you will have your unique response to get the collection from the backend API. 
By default, it returns httpResponse.body, which is suitable for a limited amount of cases.

**parseEntityHttpResponse** : function(httpResponse: any, params: any)

This function takes raw HttpResponse object directly from Axios and must provide an entity instance in response.
In most of the real-world cases your API will return a JSON with the entity, but if you have something specific - use this function to parse the response.

---

#### EntityConfig

**entityName** : string

Entity name must be the same, as the name of your entity class

**apiPath** : string

Entity resources will be accessed via {apiUrl}/{apiPath}, where apiUrl is a property of EntityStoreConfig 

**storeKey** : string 

The key in redux Store, where your EntityState instance will be put to.
Unfortunately, all your entity stores will be registered at redux Store root. There is no way to make some sub-object at the moment.

**keyProperty** string = "id"

The key property name in your entities. Typically it is "id", but we want to give you the flexibility on this.

---

#### EntityStorePage

**entities** : T[]

The array of entities, which will be put into your store collection,

**totalEntities** : number

Amount of *total* entities in the collection on the backend. This can be used for pagination.

## Feedback

Please [leave your feedback](https://github.com/zelishe/react-restdux/issues) if you notice any issues or have a feature request.

## Licence

The repository code is open-source software licensed under the [MIT license](http://opensource.org/licenses/MIT).
