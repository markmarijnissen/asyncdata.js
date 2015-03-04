
//some requirements:
// an object with a loaded(success, failure, finally) method,  a
// isLoading boolean flag, and a load() method
// implementation:
// initial state: isLoading is false


(function(definition) {
  if (typeof module !== 'undefined') {
    var signals_ = require('signals');
    module.exports = definition(signals_.Signal, signals_.CompoundSignal);
  }
  else if (typeof define === 'function' && define.amd) {
    define(['signals', 'CompoundSignal'], definition);
  }
  else {
    this['asyncData'] = definition(signals.Signal, signals.CompoundSignal);
  }
}(function(Signal, CompoundSignal) {

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
   * <code>
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
   * </code>
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
    var self = this;
    self.isLoading = false;
    self._loadingStarted = new Signal();
    self._success = new Signal();
    self._success.memorize = true;
    self._failure = new Signal();
    self._failure.memorize = true;
    self._finally = new Signal();
    self._finally.memorize = true;

    //TODO: what to do with self.isLoading with several intermixed started and finally calls?
    self._loadingStarted.add(function(){
      self.isLoading = true;
    });
    self._finally.add(function(){
      self.isLoading = false;
    });
  }

  /**
   * Register the success, failure, and finally callbacks
   * for each respective outcome.
   */
  AsyncData.prototype.resolved = function (success, failure, finally_) {

    var self = this;
    var child = new AsyncData();
    self._loadingStarted.add(function(){
      child._loadingStarted.dispatch();
    });

    self._success.add(function () {
      var data = arguments;
      if (success) {
        data = [success.apply(null, data)];
      }
      child._success.dispatch.apply(child, data);
    });

    self._failure.add(function () {
      var data = arguments;
      if (failure) {
        data = [failure.apply(null, data)];
      }
      child._failure.dispatch.apply(null, data);
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
    this._loadingStarted.dispatch();
    this.lastRequestArguments = [].slice.call(arguments);
    var promise = self._load.apply(null, arguments);
    if (promise.then == null || promise['finally'] == null) {
      console.error(promise);
      throw new Error('The callback on \'AsyncData\' must return a promise, ' +
      'it returned \'' + promise + '\' instead.')
    }
    promise.then(function (data) {
      self._success.dispatch(data);
    }, function (reason) {
      self._failure.dispatch(reason);
    });
    promise['finally'](function () {
      self.isLoading = false;
      self._finally.dispatch();
    });
    return promise;
  };

  /**
   * An AsyncData that receives multiple AsycnData's as parameters.
   *
   * Its success and finally are CompoundSignals of the passed AsyncData's
   * success and finally.
   *
   * Its requested and failure are signals that will be trigered if any of
   * the passed AsyncData's requested or failure are triggered.
   * @constructor
   */
  function CombinedAsyncData(asyncDataArray) {
    var self = this;
    var successSignals = [];
    var failureSignals = [];
    var finallySignals = [];
    var loadingStartedSignals = [];
    for (var i = 0; i < asyncDataArray.length; i++){
      successSignals.push(asyncDataArray[i]._success);
      failureSignals.push(asyncDataArray[i]._failure);
      finallySignals.push(asyncDataArray[i]._finally);
      loadingStartedSignals.push(asyncDataArray[i]._loadingStarted);
    }

    self.isLoading = false;
    // loadingStarted when at least one loadingStartedSignals is triggered
    self._loadingStarted = signalFromAny(loadingStartedSignals);//new Signal();

    // success when all sourceSignals succeed
    self._success = compoundSignalFromArray(successSignals);//new CompoundSignal.apply(null, successSignals);
    self._success.memorize = true;
    self._success.override = true;

    // failure when at least one failureSignal fails
    self._failure = signalFromAny(failureSignals);

    // finally when all finallySignals are triggered
    self._finally = compoundSignalFromArray(finallySignals);//new CompoundSignal.apply(null, finallySignals);
    self._finally.memorize = true;
    self._finally.override = true;

    self._loadingStarted.add(function(){
      self.isLoading = true;
    });
    self._finally.add(function(){
      self.isLoading = false;
    });
  }

  CombinedAsyncData.prototype = Object.create(AsyncData.prototype);
  CombinedAsyncData.prototype.constructor = CombinedAsyncData;


  var compoundSignalFromArray = (function(){
    function CompoundSignal_(signalArray) {
      return CompoundSignal.apply(this, signalArray);
    }
    CompoundSignal_.prototype = CompoundSignal.prototype;

    return function(signalArray){
      return new CompoundSignal_(signalArray);
    };
  })();

  /**
   * Create a new signal that will be dispatched if any of the signals in
   * the array are dispatched.
   * @param signalArray
   */
  function signalFromAny(signalArray){
    var signal = new Signal();
    for (var i = 0; i < signalArray.length; i++) {
      signalArray[i].add(function(){
        signal.dispatch.apply(null, arguments);
      });
    }
    return signal;
  }

  /**
   * Combine multiple asyncData into a single one.
   *
   * The semantics are that for the first time for `resolved` to be triggered,
   * all individual resolved's should have been triggered. From then on, each
   * individual `resolved` will trigger the resolved of the combined asycnData.
   *
   * For `requested`, every individual `requested` will trigger the combined
   * one.
   */
  asyncData.all = function(){
    return new CombinedAsyncData(arguments);
  };

  return asyncData;

}));
