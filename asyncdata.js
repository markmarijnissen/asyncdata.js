
//some requirements:
// an object with a loaded(success, failure, finally) method,  a
// isLoading boolean flag, and a load() method
// implementation:
// initial state: isLoading is false


(function(definition) {
  if (typeof module !== 'undefined') {
    var kefir_ = require('kefir');
    module.exports = definition(kefir_);
  }
  else if (typeof define === 'function' && define.amd) {
    define(['kefir'], definition);
  }
  else {
    this['asyncData'] = definition(Kefir);
  }
}(function(Kefir) {

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
  function AsyncData(responseStream,requestStream,i) {
    var self = this;
    
    self.index = i || 0;
    self.index++;
    console.log('AsyncData '+self.index);

    self.isLoading = false;
    self.requestStream = requestStream;
    self.responseStream = responseStream;
    self.responseStream.log('responseStream '+self.index);
    
    self.requestStream.onValue(function(){
      self.isLoading = true;
    });
    self.responseStream.onAny(function(){
      self.isLoading = false;
    });
  }

  /**
   * Register the success, failure, and finally callbacks
   * for each respective outcome.
   */
  AsyncData.prototype.resolved = function (success, failure, finally_) {
    var nextStream = this.responseStream
      .map(success)
      .mapErrors(failure)
      .toProperty();
    if(finally_) {
      this.responseStream.errorsToValues().onValue(function(){
        finally_();
      });
    }
    return new AsyncData(nextStream,this.requestStream,this.index);
  };


  AsyncData.prototype.requested = function (callback) {
    this.requestStream.onValue(callback);
    return this;
  };

  AsyncData.prototype.progressed = function (callback) {

    return this;
  };


  /**
   * Like AsyncData, but is the original data source and has a `load()` method.
   *
   * @param loadFn a function that must return a promise
   * @constructor
   */
  function AsyncDataSource(loadFn) {
    var self = this;
    var requestStream = Kefir.emitter();
    AsyncData.call(this,requestStream.flatMap().toProperty(),requestStream);
    this._load = loadFn;
  }

  AsyncDataSource.prototype = Object.create(AsyncData.prototype);
  AsyncDataSource.prototype.constructor = AsyncDataSource;

  AsyncDataSource.prototype.load = function () {
    // what about concurrent loads?
    var self = this;
    self.isLoading = true;
    var promise = self._load.apply(null, arguments);
    if (!promise.then || !promise['finally']) {
      console.error(promise);
      throw new Error('The callback on \'AsyncData\' must return a promise, ' +
      'it returned \'' + promise + '\' instead.');
    }
    var promiseStream = Kefir.fromPromise(promise);
    self.requestStream.emit(promiseStream);
    return promise;
  };

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
    var asyncDatas = Array.prototype.slice.call(arguments);
    
    var responseStreams = asyncDatas.map(function(asyncData) { 
      return asyncData.responseStream; 
    });
    var response = Kefir.combine(responseStreams).toProperty();

    var requestStreams = asyncDatas.map(function(asyncData) { 
      return asyncData.requestStream; 
    });
    var request = Kefir.merge(requestStreams);
    return new AsyncData(response,request,100);
  };

  return asyncData;

}));
