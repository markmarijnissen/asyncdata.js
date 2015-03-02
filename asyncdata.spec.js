describe("AsyncData", function() {
  'use strict';
  var deferred;
  var data;

  beforeEach(function() {
    mockPromises.install(Q.makePromise);
    mockPromises.reset();
    deferred = Q.defer();
    data = asyncData(function(){
      return deferred.promise;
    });
  });

  it("should call the load function with the passed arguments", function(){

    var loadFn = jasmine.createSpy('loadFn').and.returnValue(deferred.promise);
    var data = asyncData(loadFn);
    data.load(1, 2, 'la');
    expect(loadFn).toHaveBeenCalledWith(1, 2, 'la');
    expect(data.lastRequestArguments).toEqual([1, 2, 'la']);
  });

  describe("should trigger ", function(){

    var successCb;
    var failureCb;
    var finalyCb;
    var loadPromise;

    beforeEach(function(){
      successCb = jasmine.createSpy('successCb');
      failureCb = jasmine.createSpy('failureCb');
      finalyCb = jasmine.createSpy('finalyCb');

      data.resolved(successCb, failureCb, finalyCb);
      loadPromise = data.load();

      expect(successCb).not.toHaveBeenCalled();
      expect(failureCb).not.toHaveBeenCalled();
      expect(finalyCb).not.toHaveBeenCalled();
    });

    it("the loaded success callback", function() {

      deferred.resolve([1,2]);

      mockPromises.executeForPromise(deferred.promise);
      mockPromises.executeForPromise(loadPromise);

      expect(successCb).toHaveBeenCalledWith([1,2]);
      expect(failureCb).not.toHaveBeenCalled();
      expect(finalyCb).toHaveBeenCalledWith();

    });

    it("the loaded failure callback", function() {
      deferred.reject('not happening');

      mockPromises.executeForPromise(deferred.promise);
      mockPromises.executeForPromise(loadPromise);

      expect(successCb).not.toHaveBeenCalled();
      expect(failureCb).toHaveBeenCalledWith('not happening');
      expect(finalyCb).toHaveBeenCalledWith();

    });
  });

  describe('with chained \'loaded\' should', function(){

    var successCb;
    var failureCb;
    var finalyCb;
    var loadPromise;

    beforeEach(function(){
      successCb = jasmine.createSpy('successCb');
      failureCb = jasmine.createSpy('failureCb');
      finalyCb = jasmine.createSpy('finalyCb');
    });

    describe('propagate the original data if no callbacks are added to the first \'loaded\'', function(){

      beforeEach(function(){
        data
        .resolved()
        .resolved(successCb, failureCb, finalyCb);
        loadPromise = data.load();
      });

      it('on success', function(){

        deferred.resolve(5);

        mockPromises.executeForPromise(deferred.promise);
        mockPromises.executeForPromise(loadPromise);

        expect(successCb).toHaveBeenCalledWith(5);
        expect(failureCb).not.toHaveBeenCalled();
        expect(finalyCb).toHaveBeenCalledWith();

      });

      it('on failure', function(){

        deferred.reject('no');

        mockPromises.executeForPromise(deferred.promise);
        mockPromises.executeForPromise(loadPromise);

        expect(successCb).not.toHaveBeenCalled();
        expect(failureCb).toHaveBeenCalledWith('no');
        expect(finalyCb).toHaveBeenCalledWith();

      });

    });

    describe('propagate the returned data of the callbacks of the first \'loaded\'', function(){
      var successData;
      var failureData;

      beforeEach(function(){
        data
        .resolved(function(){
          return successData;
        }, function (){
          return failureData;
        }, function(){
        })
        .resolved(successCb, failureCb, finalyCb);
        loadPromise = data.load();

      });

      it('on success', function(){

        successData = 2;
        deferred.resolve(5);

        mockPromises.executeForPromise(deferred.promise);
        mockPromises.executeForPromise(loadPromise);

        expect(successCb).toHaveBeenCalledWith(2);
        expect(failureCb).not.toHaveBeenCalled();
        expect(finalyCb).toHaveBeenCalledWith();

      });

      it('on failure', function(){

        failureData = 'fail';
        deferred.reject('no');

        mockPromises.executeForPromise(deferred.promise);
        mockPromises.executeForPromise(loadPromise);


        expect(successCb).not.toHaveBeenCalled();
        expect(failureCb).toHaveBeenCalledWith('fail');
        expect(finalyCb).toHaveBeenCalledWith();

      });
    });




  });

  describe('with doubly chained \'loaded\' should', function() {

    var successCb;
    var failureCb;
    var finalyCb;
    var loadPromise;

    beforeEach(function () {
      successCb = jasmine.createSpy('successCb');
      failureCb = jasmine.createSpy('failureCb');
      finalyCb = jasmine.createSpy('finalyCb');
    });

    describe('propagate the returned data of the callbacks of the second \'loaded\'', function () {

      describe('when callbacks are added in the first \'loaded\'', function(){
        var successData;
        var failureData;
        var secondSuccessData;
        var secondFailureData;

        beforeEach(function () {
          data
          .resolved(function () {
            return successData;
          }, function () {
            return failureData;
          }, function () {
          })
          .resolved(function(){
            return secondSuccessData;
          }, function(){
            return secondFailureData;
          })
          .resolved(successCb, failureCb, finalyCb);
          loadPromise = data.load();

        });
        it('on success', function(){

          secondSuccessData = 2;
          deferred.resolve(5);

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(loadPromise);

          expect(successCb).toHaveBeenCalledWith(2);
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).toHaveBeenCalledWith();

        });

        it('on failure', function(){

          secondFailureData = 'fail';
          deferred.reject('no');

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(loadPromise);


          expect(successCb).not.toHaveBeenCalled();
          expect(failureCb).toHaveBeenCalledWith('fail');
          expect(finalyCb).toHaveBeenCalledWith();

        });
      });

      describe('when no callbacks are added on first \'loaded\'', function(){

        var secondSuccessData;
        var secondFailureData;

        beforeEach(function () {
          data
          .resolved()
          .resolved(function(){
            return secondSuccessData;
          }, function(){
            return secondFailureData;
          })
          .resolved(successCb, failureCb, finalyCb);
          loadPromise = data.load();

        });
        it('on success', function(){

          secondSuccessData = 2;
          deferred.resolve(5);

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(loadPromise);

          expect(successCb).toHaveBeenCalledWith(2);
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).toHaveBeenCalledWith();

        });

        it('on failure', function(){

          secondFailureData = 'fail';
          deferred.reject('no');

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(loadPromise);


          expect(successCb).not.toHaveBeenCalled();
          expect(failureCb).toHaveBeenCalledWith('fail');
          expect(finalyCb).toHaveBeenCalledWith();

        });
      });


    });

    describe('propagate the returned data of the callbacks of the first \'loaded\'', function () {

      var successData;
      var failureData;

      beforeEach(function () {
        data
        .resolved(function () {
          return successData;
        }, function () {
          return failureData;
        }, function () {
        })
        .resolved()
        .resolved(successCb, failureCb, finalyCb);
        loadPromise = data.load();

      });
      it('on success', function(){

        successData = 2;
        deferred.resolve(5);

        mockPromises.executeForPromise(deferred.promise);
        mockPromises.executeForPromise(loadPromise);

        expect(successCb).toHaveBeenCalledWith(2);
        expect(failureCb).not.toHaveBeenCalled();
        expect(finalyCb).toHaveBeenCalledWith();

      });

      it('on failure', function(){

        failureData = 'fail';
        deferred.reject('no');

        mockPromises.executeForPromise(deferred.promise);
        mockPromises.executeForPromise(loadPromise);


        expect(successCb).not.toHaveBeenCalled();
        expect(failureCb).toHaveBeenCalledWith('fail');
        expect(finalyCb).toHaveBeenCalledWith();

      });

    });

    describe('propagate the original data if no callbacks are added', function () {

      beforeEach(function () {
        data
        .resolved()
        .resolved()
        .resolved(successCb, failureCb, finalyCb);
        loadPromise = data.load();

      });
      it('on success', function(){

        deferred.resolve(5);

        mockPromises.executeForPromise(deferred.promise);
        mockPromises.executeForPromise(loadPromise);

        expect(successCb).toHaveBeenCalledWith(5);
        expect(failureCb).not.toHaveBeenCalled();
        expect(finalyCb).toHaveBeenCalledWith();

      });

      it('on failure', function(){

        deferred.reject('no');

        mockPromises.executeForPromise(deferred.promise);
        mockPromises.executeForPromise(loadPromise);


        expect(successCb).not.toHaveBeenCalled();
        expect(failureCb).toHaveBeenCalledWith('no');
        expect(finalyCb).toHaveBeenCalledWith();

      });

    });


  });

  it('\'load\' should throw Error when no promise is returned', function(){

    var data = asyncData(2);

    expect(data.load).toThrow();

  });


  describe('requested signals', function(){

    var loadingCb1, loadingCb2, loadingCb3;


    beforeEach(function(){
      loadingCb1 = jasmine.createSpy('loadingCb1');
      loadingCb2 = jasmine.createSpy('loadingCb2');
      loadingCb3 = jasmine.createSpy('loadingCb3');
    });

    it('should be triggered for all chained results', function(){
      data.requested(loadingCb1);
      var data2 = data.resolved();
      data2.requested(loadingCb2);
      var data3 = data2.resolved();
      data3.requested(loadingCb3);
      data.load();

      expect(data.isLoading).toBe(true);
      expect(data2.isLoading).toBe(true);
      expect(data3.isLoading).toBe(true);

      expect(loadingCb1).toHaveBeenCalled();
      expect(loadingCb2).toHaveBeenCalled();
      expect(loadingCb3).toHaveBeenCalled();
    });

    it('should be possible to chain', function(){
      data.requested(loadingCb1)
      .resolved()
      .requested(loadingCb2)
      .resolved()
      .requested(loadingCb3);
      data.load();

      expect(loadingCb1).toHaveBeenCalled();
      expect(loadingCb2).toHaveBeenCalled();
      expect(loadingCb3).toHaveBeenCalled();
    })
  });

  describe('\'loaded\' should be immediately triggered for a chained result if the source has already been loaded', function(){

    var successCb;
    var failureCb;
    var finalyCb;
    var loadPromise;
    var successData = [1,2];

    beforeEach(function(){
      successCb = jasmine.createSpy('successCb');
      failureCb = jasmine.createSpy('failureCb');
      finalyCb = jasmine.createSpy('finalyCb');

      loadPromise = data.load();
      deferred.resolve(successData);
      mockPromises.executeForPromise(deferred.promise);
      mockPromises.executeForPromise(loadPromise);

    });

    it('for one chained result', function(){

      var result;
      data.resolved(function(data){
        result = data;
      });
      expect(result).toEqual(successData);
    });

    it('for two chained results', function(){

      var result;
      var data2 = data.resolved();
      data2.resolved(function(data){
        result = data;
      });

      expect(result).toEqual(successData);
    });

    it('for two chained results with intermediate result', function(){

      var result;
      var data2 = data.resolved(function(){
        return 2;
      });
      data2.resolved(function(data){
        result = data;
      });

      expect(result).toEqual(2);
    });

  });

  it('second \'load\' should retrigger loaded', function(){

    var successCb1 = jasmine.createSpy('successCb1');
    var successCb2 = jasmine.createSpy('successCb2');

    data.resolved(successCb1).resolved(successCb2);

    var loadPromise = data.load();
    deferred.resolve(2);
    mockPromises.executeForPromise(deferred.promise);
    mockPromises.executeForPromise(loadPromise);

    expect(successCb1.calls.count()).toEqual(1);
    expect(successCb2.calls.count()).toEqual(1);


    loadPromise = data.load();
    mockPromises.executeForPromise(deferred.promise);
    mockPromises.executeForPromise(loadPromise);

    expect(successCb1.calls.count()).toEqual(2);
    expect(successCb2.calls.count()).toEqual(2);

  });

  describe('all()', function(){

    var deferred2, data2;

    beforeEach(function() {
      deferred2 = Q.defer();
      data2 = asyncData(function(){
        return deferred2.promise;
      });
    });

    it('should return an AsyncData', function(){
      var combined = asyncData.all(data, data2)
      expect(combined.requested).toBeDefined();
      expect(combined.resolved).toBeDefined();
    });

    describe('returned AsyncData', function(){

      var combined, successCb, failureCb, finalyCb, loadPromise, loadPromise2;

      beforeEach(function() {
        successCb = jasmine.createSpy('successCb');
        failureCb = jasmine.createSpy('failureCb');
        finalyCb = jasmine.createSpy('finalyCb');

        combined = asyncData.all(data, data2)
          .resolved(successCb, failureCb, finalyCb);

        data.load();
        data2.load();

        expect(successCb).not.toHaveBeenCalled();
        expect(failureCb).not.toHaveBeenCalled();
        expect(finalyCb).not.toHaveBeenCalled();

      });

      describe('resolved callback', function(){

        it('should be triggered when both source signals are resolved', function(){

          deferred.resolve([5, 6]);
          deferred2.resolve('lala');

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(deferred2.promise);

          expect(successCb).toHaveBeenCalledWith([[5, 6]], ['lala']);
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).toHaveBeenCalled();
        });

        it('should be triggered a second time when at least one source signal is resolved', function(){
          deferred.resolve([5, 6]);
          deferred2.resolve('lala');

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(deferred2.promise);

          expect(successCb.calls.count()).toEqual(1);
          expect(finalyCb.calls.count()).toEqual(1);

          data2.load();

          expect(successCb).toHaveBeenCalledWith([[5, 6]], ['lala']);
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).toHaveBeenCalled();

          expect(successCb.calls.count()).toEqual(2);
          expect(finalyCb.calls.count()).toEqual(2);
        })
      })



    })


  });
});
