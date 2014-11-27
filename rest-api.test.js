/*jshint expr:true*/
/*global afterEach:false, describe:false, it:false, beforeEach:false, expect:false, sinon:false*/
describe('Rest-api', function () {
    var api,
        sandbox,
        response,
        request,
        testPrefix,
        logger,
        testSettings,
        middleWareInstance,
        middleWareRouter,
        parsers,
        authenticationHandler;

    //NOTE: Munit doesn't support nesting of after/beforeEach hence the somewhat ugly setup
    beforeEach(function () {
        if (sandbox) {
            sandbox.restore();
        }

        testPrefix = '/awesome';

        sandbox = sinon.sandbox.create();

        middleWareInstance = {
            use: sandbox.stub(),
            all: sandbox.stub()
        };

        middleWareRouter = {
            use: sandbox.stub(),
            all: sandbox.stub(),
            get: sandbox.stub(),
            post: sandbox.stub(),
            put: sandbox.stub(),
            delete: sandbox.stub()
        };


        response = {
            json: sandbox.stub(),
            sendStatus: sandbox.stub()
        };

        request = {
            path:'',
            params: {},
            body: {
                'test': 'body'
            },
            headers: {}
        };

        var bodyParser = {
            foo: 'bar'
        };

        var otherParser = {
            bar: 'foo'
        };

        parsers = [bodyParser, otherParser];

        logger = {
            error: sandbox.stub(),
            warn: sandbox.stub(),
            info: sandbox.stub(),
            log: sandbox.stub()
        };

        authenticationHandler = sandbox.stub();

        testSettings = {pathPrefix: testPrefix};

        api = new RestApi(testSettings, authenticationHandler, logger, middleWareInstance, middleWareRouter, parsers);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#constructor', function () {
        it('Should add a new connectHandler to connect', function () {
            var use = sandbox.spy(WebApp.connectHandlers, 'use');

            new RestApi(testSettings, undefined, logger, middleWareInstance, middleWareRouter);

            expect(use).to.have.been.calledOnce;
            expect(use).to.have.been.calledWith(testPrefix);
        });

        it('Should setup connectHandler so it catches all request to the pathPrefix', function () {
            new RestApi(testSettings, undefined, logger, middleWareInstance, middleWareRouter);

            expect(middleWareInstance.all).to.have.been.calledWith('/*');
        });

        it('Should setup 2 helpers on the connectHandler with use', function () {
            new RestApi(testSettings, undefined, logger, middleWareInstance, middleWareRouter);
            expect(middleWareInstance.use.callCount).to.equal(5);
        });

        it('Should add use given parsers on the connectHandler', function () {
            _.each(parsers, function (item) {
                expect(middleWareInstance.use).to.have.been.calledWith(item);
            });
        });

        describe('Called with a authenticationHandler', function () {
            it('Should call next when authenticationHandler returns true', function () {
                var next = sandbox.stub();
                authenticationHandler.returns(true);
                middleWareRouter.use.args[0][0](request, response, next);
                expect(next).to.have.been.called;
                expect(authenticationHandler).to.have.been.calledWithExactly(request.params, request.body, request.headers);
            });

            it('Should throw a authentication error if authentitcationHandler returns false', function () {
                var next = sandbox.stub();
                authenticationHandler.returns(false);

                expect(function () {middleWareRouter.use.args[0][0](request, response, next);}).to.throw(/Authentication Error/);
                expect(next).to.not.have.been.called;
            });
        });
    });

    describe('#handleError', function () {
        it('Should call error on the logger', function () {
            api.handleError({}, request, response);
            expect(logger.error).to.have.been.calledOnce;
        });

        it('Should return error 500', function () {
            api.handleError({}, request, response);
            expect(response.sendStatus).to.have.been.calledWith(500);
        });

        describe('Called with a error that has a status', function () {
            it('Should return the status of the error', function () {
                var testError = {status: 123};
                api.handleError(testError, request, response);
                expect(response.sendStatus).to.have.been.calledWith(testError.status);
            });
        });
    });

    describe('#add', function () {
        describe('When called with a url', function () {
            describe('When called with a handlers object', function () {
                it('Should add routes for the handlers', function () {
                    var testUrl = '/123';
                    var testHandlers = {
                        GET: sandbox.stub(),
                        POST: sandbox.stub(),
                        PUT: sandbox.stub(),
                        DELETE: sandbox.stub()
                    };

                    api.add(testUrl, testHandlers);

                    _.each(testHandlers, function(item, key) {
                        expect(middleWareRouter[key.toLowerCase()]).to.have.been.calledOnce;
                        expect(middleWareRouter[key.toLowerCase()]).to.have.been.calledWith(testUrl);
                    });
                });

                it('Should throw a error for any handlers that are NOT GET,PUT,POST,DELETE', function () {
                    var testUrl = '/123';
                    var testHandlers = {
                        bla: sandbox.stub()
                    };

                    expect(function () {api.add(testUrl, testHandlers);}).to.throw(/Non-existing/);
                });

                it('Should wrap the given handler so that res.json gets called with what the handler returns', function () {
                    var testUrl = '/123';
                    var testReturnValue = 'test123';
                    var testHandlers = {
                        GET: sandbox.stub().returns(testReturnValue)
                    };

                    api.add(testUrl, testHandlers);

                    var wrappedHandler = middleWareRouter.get.args[0][1];
                    wrappedHandler(request, response, function () {});

                    expect(testHandlers.GET).to.have.been.calledWith(request.params, request.body);
                    expect(response.json).to.have.been.calledWith(testReturnValue);
                });
            });
        });
    });
});
