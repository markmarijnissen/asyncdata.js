# asyncdata.js
Signal notifications for asynchronous data loading and post-processing

## How to use

```js
// create an instance with a callback that loads the data and returns a promise
var data = asyncData(function(){
  return Q($.get('api/data'));
});

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
// triggers all resolved callbacks, stores result
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
bower install dtheodor/asyncdata --production
```

### Run tests
```sh
bower install dtheodor/asyncdata
```

Then simply open [SpecRunner.html](SpecRunner.html) with your browser.

## Rationale:

### Problem
- There's a module that knows how to load (and re-load) data through an API, and stores it locally.
- Multiple modules access the loaded data, and transform them into a different representation (each module does a different transform), also storing them locally.
- The transformed data is exposed to the view, with a 'loading' indication when the original data is (re)loaded and/or the transformation is in progress.

### Promises
Promises support:
- on resolution callbacks, where the transform function can be attached.
- a `isResolved` attribute, which is false when the promise has been started but not yet resolved.
- propagate fully, so a chain can be built

However this support is fire-once. Once a promise is resolved, it is resolved forever. The reloading use-case is not supported.

### Requirements
Would be great to have a promise-like object that:

1. its completion can be reset or re-triggered, which will invoke all the `.then` methods again
2. its start can also be re-triggered, which will set the `isResolved` attribute

This can also be implemented with signals:
- provides a `.resolved(successCallback, failureCallback, finalyCallback)` function that allows to register callbacks on load finish. This returns a new object with a `.loaded` method, so it can be chained as promises.
- provides a `.requested(callback)` method that allows to register a single method on request start
