# asyncdata.js
Signal notifications for asynchronous data loading and syncrhonous post-processing

## How to use

```js

// so you have a function that requests data and returns a promise
function loadData(){
  return $http.get('api/data');
}
// create an instance by passing this function
var data = asyncData(loadData);

// attach post-processing callbacks
data
  .resolved(function(data){
    return transform1(data);
  })
  .resolved(function(transformed){
    // this receives the result of the previous 'resolved'
    return transform2(transformed);
  });

data.load();
// triggers all resolved callbacks
data.load();
// triggers all callbacks again
```

Notifications can be added on each request's start

```js
data
  .requested(function(){
      console.log('loading data...')
    })
  .resolved(function(data){
    return transform(data);
  })
  .requested(function(){
    console.log('transforming data...')
  })
  .resolved(function(data){
    console.log('got the transformed data', data);
  });
data.load();
// we will see:
// 'loading data...'
// 'transforming data...'
// 'got the transformed data'
```

Late `resolved`s will be called immediately with the previous step's cached results
```js
var transformed = data
  .resolved(function(data){
    return transform1(data);
  });
  
data.load();
// time goes by..

transformed.resolved(function(data){
  //this is triggered instantly as long as the transform1 has finished
  return transform2(data);
});
```

How is this different than promises? It

1. triggers the callbacks each time it is `load()`ed, instead of only once
2. it provides a notification on request start
3. it is slightly uglier as an API


## Install

```sh
bower install dtheodor/asyncdata.js --production
```

### Run tests
```sh
bower install dtheodor/asyncdata.js
```

Then simply open [SpecRunner.html](SpecRunner.html) with your browser.

## Rationale:

### Problem
- There's a module that knows how to load (and re-load) data through an API, and stores it locally.
- Multiple modules access the loaded data, and transform them into a different representation (each module does a different transform), also storing them locally. Each time the data they depend on is reloaded, they need to re-run the transformation to update.
- The transformed data is exposed to the view, with a 'loading' indication when the original data is being (re)loaded and/or the transformation is in progress.

### Solution

Can promises do this? Promises support:
- on resolution callbacks, where the transform function can be attached.
- a `isResolved` attribute, which is false when the promise has been started but not yet resolved.
- propagation, so that transformations can be chained

However this support is fire-once. Once a promise is resolved, it is resolved forever. The reloading use-case is not supported.

Would be great to have a promise-like object that:

1. its completion can be reset or re-triggered, which will invoke all the `.then` methods again
2. its start can also be a notification that is also possible to re-trigger.

A promise-based implementation of this is possible, with a wrapper that on re-load discards the old promise and creates a new one and re-attaches all the `.then()` callbacks. This can also be implemented with signals:
- a `.resolved(successCallback, failureCallback, finalyCallback)` signal that allows to register callbacks on load finish. This returns a new object with a `.loaded` method, so it can be chained as promises.
- a `.requested(callback)` signal that allows to register a single method on request start

This implementation is a signal-based implementation.
