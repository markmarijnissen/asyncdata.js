
//some requirements:
// an object with a loaded(success, failure, finally) method,  a
// isLoading boolean flag, and a load() method
// implementation:
// initial state: isLoading is false


(function(definition) {
    if (typeof module !== 'undefined') {
      module.exports = definition();
    }
    else if (typeof define === 'function' && define.amd) {
      define(['signals'], definition);
    }
    else {
      this['asyncData'] = definition(signals.Signal);
    }
}(function(Signal) {

  /**
   * Returns an object with a `resolved(success, failure, finally)` method,
   * similar to a promise .then() . The loaded callbacks are triggered every
   * time the `load()` method is resolved. `resolved` calls can be chained like
   * promise .then() calls. each `resolved` in the chain is resolved with the
   * value of the previous `resolved` success/failure callbacks.
   *
   * The object also has a `requested(callback)` method that will be
   * triggered every time the `load()` method is invoked. An accompanying
   * `isLoading` flag is also set when loading is started, and unset when
   * loading is finished.
   *
   * The object also has a `progressed(callback)` method that is triggered while
   * the data is being loaded.
   *
   * The sequence of events after a load() is called is:
   * Events       |   State
   * requested()  |   isLoading == true
   * progressed() |   isLoading == true
   * resolved()   |   isLoading == false
   *
   * If a load() is called while the object has not been resolved yet
   *
   * @param loadFn a function that returns a promise. The resolution of the
   *    promise must return the loaded data.
   * @return {AsyncDataSource}
   *
   * Example:
   *
   asyncData(function(){
      return $http.get('api/data');
    })
   .resolved(function(data){
      return transform(data);
    })
   .resolved(function(data){
      console.log('got the transformed data', data)
    });

   data.load();
   //this will trigger the promise resolution and then the transform.
   //we must see:
   //loading data...
   //transforming data...
   //got the transformed data

   Requested can be used for notifications when the data is (re)loaded

   var data = asyncData(function(){
      return $http.get('api/data');
    });

   data.requested(function(progress){
      console.log('loading data...')
    });

   var transformedData = data.resolved(function(data){
      return transform(data);
    });

   transformedData.requested(function(){
      console.log('transforming data...')
    });

   transformedData.resolved(function(data){
      console.log('got the transformed data', data)
    });

   data.load();
   //we will see:
   //loading data...
   //transforming data...
   //got the transformed data

   Requested can also be chained, and returns the same async data object it
   operates on.

   var data = asyncData(function(){
      return $http.get('api/data');
    })
   .requested(function(progress){
      console.log('loading data...')
    })
   .resolved(function(data){
      return transform(data);
    }).requested(function(){
      console.log('transforming data...')
    })
   .resolved(function(data){
      console.log('got the transformed data', data)
    });

   *
   */
  function asyncData(loadFn) {
    return new AsyncDataSource(loadFn);
  }

  /**
   * An object with `resolved()` and `requested()` signals that are re-triggered
   * everytime the data it depends on is reloaded.
   * @constructor
   */
  function AsyncData() {
    this.isLoading = false;
    this._loadingStarted = new Signal();
    this._success = new Signal();
    this._failure = new Signal();
    this._finally = new Signal();
    this._hasLoadedOnce = false;
    this._lastSuccessData = undefined;
    this._chainedAsyncData = [];
  }

  /**
   * Register the success, failure, and finally callbacks
   * for each respective outcome.
   */
  AsyncData.prototype.resolved = function (success, failure, finally_) {

    var self = this;
    var child = new AsyncData();
    self._chainedAsyncData.push(child);

    if (self._hasLoadedOnce) {
      // if already fired, fire immediately on 'loaded' callback registration
      var data = self._lastSuccessData;
      if (success) {
        data = success.call(self, data);
      }
      child._dispatchSuccess(data);
    }
    self._success.add(function (data) {
      if (success) {
        data = success.call(self, data);
      }
      child._dispatchSuccess(data);
    });

    self._failure.add(function (reason) {
      if (failure) {
        reason = failure.call(self, reason);
      }
      child._failure.dispatch(reason);
    });

    self._finally.add(function () {
      if (finally_) {
        finally_();
      }
      child.isLoading = false;
      child._finally.dispatch();
    });

    return child;
  };

  /**
   * Dispatch the signal that will trigger the `loadingStarted` callbacks for
   * this AsyncData and all its chained children.
   * @private
   */
  AsyncData.prototype._dispatchLoadingStarted = function () {
    this.isLoading = true;
    this._loadingStarted.dispatch();
    for (i = 0; i < this._chainedAsyncData.length; i++) {
      this._chainedAsyncData[i]._dispatchLoadingStarted();
    }
  };

  /**
   * Trigger the success callback, and memoize the success data.
   * @private
   */
  AsyncData.prototype._dispatchSuccess = function (data) {
    this._hasLoadedOnce = true;
    this._lastSuccessData = data;
    this._success.dispatch(data);
  };


  AsyncData.prototype.requested = function (callback) {
    if (callback) {
      this._loadingStarted.add(callback);
    }
    return this;
  };

  AsyncData.prototype.progressed = function (callback) {
    //TODO: integrate with promise.notify()
  };


  /**
   * Like AsyncData, but is the original data source and has a `load()` method.
   *
   * @param loadFn a function that must return a promise
   * @constructor
   */
  function AsyncDataSource(loadFn) {
    AsyncData.call(this);
    this._load = loadFn;
  }

  AsyncDataSource.prototype = Object.create(AsyncData.prototype);
  AsyncDataSource.prototype.constructor = AsyncDataSource;

  AsyncDataSource.prototype.load = function () {
    // what about concurrent loads?
    var self = this;
    this._dispatchLoadingStarted();
    this.lastRequestArguments = [].slice.call(arguments);
    var promise = self._load.apply(null, arguments);
    if (promise.then == null || promise['finally'] == null) {
      console.error(promise);
      throw new Error('The callback on \'AsyncData\' must return a promise, ' +
      'it returned \'' + promise + '\' instead.')
    }
    promise.then(function (data) {
      self._dispatchSuccess(data);
    }, function (reason) {
      self._failure.dispatch(reason);
    });
    promise['finally'](function () {
      self.isLoading = false;
      self._finally.dispatch();
    });
    return promise;
  };


  return asyncData;

}));
