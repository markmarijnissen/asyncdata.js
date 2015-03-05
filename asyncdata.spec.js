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

    it("the resolved success callback", function() {

      deferred.resolve([1,2]);

      mockPromises.executeForPromise(deferred.promise);
      mockPromises.executeForPromise(loadPromise);

      expect(successCb).toHaveBeenCalledWith([1,2]);
      expect(failureCb).not.toHaveBeenCalled();
      expect(finalyCb).toHaveBeenCalledWith();

    });

    it("the resolved failure callback", function() {
      deferred.reject('not happening');

      mockPromises.executeForPromise(deferred.promise);
      mockPromises.executeForPromise(loadPromise);

      expect(successCb).not.toHaveBeenCalled();
      expect(failureCb).toHaveBeenCalledWith('not happening');
      expect(finalyCb).toHaveBeenCalledWith();

    });
  });

  describe('with chained \'resolved\' should', function(){

    var successCb;
    var failureCb;
    var finalyCb;
    var loadPromise;

    beforeEach(function(){
      successCb = jasmine.createSpy('successCb');
      failureCb = jasmine.createSpy('failureCb');
      finalyCb = jasmine.createSpy('finalyCb');
    });

    describe('propagate the original data if no callbacks are added to the first \'resolved\'', function(){

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

    describe('propagate the returned data of the callbacks of the first \'resolved\'', function(){
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

  describe('with doubly chained \'resolved\' should', function() {

    var successCb;
    var failureCb;
    var finalyCb;
    var loadPromise;

    beforeEach(function () {
      successCb = jasmine.createSpy('successCb');
      failureCb = jasmine.createSpy('failureCb');
      finalyCb = jasmine.createSpy('finalyCb');
    });

    describe('propagate the returned data of the callbacks of the second \'resolved\'', function () {

      describe('when callbacks are added in the first \'resolved\'', function(){
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

      describe('when no callbacks are added on first \'resolved\'', function(){

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

    describe('propagate the returned data of the callbacks of the first \'resolved\'', function () {

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
    });

    it('should propagate to combined AsyncData', function(){


      var combined = asyncData.all(data);
      combined.requested(loadingCb1);
      var last = combined.resolved().requested(loadingCb2);

      data.load();
      expect(combined.isLoading).toEqual(true);
      expect(last.isLoading).toEqual(true);
      expect(loadingCb1).toHaveBeenCalled();
      expect(loadingCb2).toHaveBeenCalled();


    })
  });

  describe('\'resolved\' should be immediately triggered for a chained result if the source has already been loaded', function(){

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

  it('second \'load\' should retrigger resolved', function(){

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

    describe('combined AsyncData', function(){

      var combined, successCb, failureCb, finalyCb, requestCb;

      beforeEach(function() {
        combined = asyncData.all(data, data2);

        successCb = jasmine.createSpy('successCb');
        failureCb = jasmine.createSpy('failureCb');
        finalyCb = jasmine.createSpy('finalyCb');
        requestCb = jasmine.createSpy('requestCb');
      });

      describe('resolved callback', function(){

        beforeEach(function(){
          combined.resolved(successCb, failureCb, finalyCb);

          data.load();
          data2.load();

          expect(successCb).not.toHaveBeenCalled();
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).not.toHaveBeenCalled();
        });

        it('should be triggered when both source signals are resolved', function(){

          deferred.resolve('abab');
          deferred2.resolve('lala');

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(deferred2.promise);

          expect(successCb).toHaveBeenCalledWith(['abab', 'lala']);
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).toHaveBeenCalled();
        });

        it('should be triggered a second time when at least one source signal is resolved', function(){
          deferred.resolve('abab');
          deferred2.resolve('lala');

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(deferred2.promise);

          expect(successCb.calls.count()).toEqual(1);
          expect(finalyCb.calls.count()).toEqual(1);

          data2.load();
          mockPromises.executeForPromise(deferred2.promise);

          expect(successCb).toHaveBeenCalledWith(['abab', 'lala']);
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).toHaveBeenCalled();

          expect(successCb.calls.count()).toEqual(2);
          expect(finalyCb.calls.count()).toEqual(2);
        });

        it('should not be triggered when only one source signals is resolved', function(){

          deferred.resolve('abab');

          mockPromises.executeForPromise(deferred.promise);

          expect(successCb).not.toHaveBeenCalled();
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).not.toHaveBeenCalled();
        });

        it('should be triggered when at least one source signals is rejected', function(){

          deferred.reject('pwned');

          mockPromises.executeForPromise(deferred.promise);

          expect(successCb).not.toHaveBeenCalled();
          expect(failureCb).toHaveBeenCalledWith('pwned');
          expect(finalyCb).toHaveBeenCalled();
        });
      });

      describe('requested callback', function(){

        beforeEach(function(){
          combined.requested(requestCb);
        });

        it('should be triggered when at least one source signal is loaded', function(){
          data2.load();

          expect(combined.isLoading).toEqual(true);
          expect(requestCb).toHaveBeenCalled();

        });

      });

      describe('with chained resolved', function(){

        it('should propagate requested to the chained AsyncData', function(){
          var requestCb2 = jasmine.createSpy('requestCb2');
          var result1 = combined.
            resolved().
            requested(requestCb);
          var result2 = result1.
            resolved(function(){
              return 6;
            }).
            requested(requestCb2);

          data.load();
          expect(result1.isLoading).toEqual(true);
          expect(result2.isLoading).toEqual(true);
          expect(requestCb).toHaveBeenCalled();
          expect(requestCb2).toHaveBeenCalled();

        });

        it('should propagate arguments without intermediate results', function(){

          combined.resolved()
            .resolved(successCb, failureCb, finalyCb);

          deferred.resolve('abab');
          deferred2.resolve('lala');
          data.load();
          data2.load();

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(deferred2.promise);

          expect(successCb).toHaveBeenCalledWith(['abab','lala']);
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).toHaveBeenCalled();

        });

        it('should propagate success arguments with intermediate results', function(){

          combined
            .resolved(function(){
              return 5;
            })
            .resolved(successCb, failureCb, finalyCb);

          deferred.resolve('abab');
          deferred2.resolve('lala');
          data.load();
          data2.load();

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(deferred2.promise);

          expect(successCb).toHaveBeenCalledWith(5);
          expect(failureCb).not.toHaveBeenCalled();
          expect(finalyCb).toHaveBeenCalled();

        });

        it('should propagate rejection arguments with intermediate results', function(){

          combined
            .resolved(null, function(){
              return 'failed';
            })
            .resolved(successCb, failureCb, finalyCb);

          deferred.resolve('abab');
          deferred2.reject('lala');
          data.load();
          data2.load();

          mockPromises.executeForPromise(deferred.promise);
          mockPromises.executeForPromise(deferred2.promise);

          expect(successCb).not.toHaveBeenCalled();
          expect(failureCb).toHaveBeenCalledWith('failed');
          expect(finalyCb).toHaveBeenCalled();

        });


      });

      it('should trigger resolved when attached late', function(){

        deferred.resolve('abab');
        deferred2.resolve('lala');
        data.load();
        data2.load();
        mockPromises.executeForPromise(deferred.promise);
        mockPromises.executeForPromise(deferred2.promise);

        combined.resolved(successCb, failureCb, finalyCb);

        expect(successCb).toHaveBeenCalledWith(['abab','lala']);
        expect(failureCb).not.toHaveBeenCalled();
        expect(finalyCb).toHaveBeenCalled();

      })
    });
  });

  it('should trigger multiple parallel resolved', function(){

    // this test triggers a bug caused by writing a for loop as
    // `for(i = 0; ...)` instead of `for(var i = 0; ...)`
    // (notice the `var` missing)
    var successCb1 = jasmine.createSpy('successCb1');
    var successCb2 = jasmine.createSpy('successCb2');
    var successCb3 = jasmine.createSpy('successCb3');
    var successCb4 = jasmine.createSpy('successCb4');

    data.resolved(successCb1);
    data.resolved(successCb2);
    data.resolved(successCb3);
    data.resolved(successCb4);

    data.load();
    deferred.resolve([1,2]);
    mockPromises.executeForPromise(deferred.promise);

    expect(successCb1).toHaveBeenCalledWith([1,2]);
    expect(successCb1).toHaveBeenCalledWith([1,2]);
    expect(successCb1).toHaveBeenCalledWith([1,2]);
    expect(successCb1).toHaveBeenCalledWith([1,2]);

  });
});
