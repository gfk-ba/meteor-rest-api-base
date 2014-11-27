/* global RestApi:true, WebApp:false*/

RestApi = (function () {
    /**
     * Wrapper for connect middleware
     *
     * @constructor
     * @param {Object}   settings              Settings to use for setting up this rest-api
     * @param {Function} authenticationHandler The authenticationHandler that will be first called on overy request
     * @param {Object}   [logger=console]      The logger to use
     * @param {Object}   connectHandler        The connect middleware handling the connections for example express gets arguments: parameters, body, header
     * @param {Object}   router                The connect middleware router plugin to handle routing
     * @param {Array|String}   parser          The parser(s) to run on incoming requests
     */
    function RestApi (settings, authenticationHandler, logger, connectHandler, router, parser) {
        this._settings = settings || {};
        _.defaults(this._settings, this.defaultSettings);

        this._routes = [];
        this._logger = logger || console;

        this._connectHandler = connectHandler;
        if (_.isArray(parser)) {
            _.each(parser, function (item) {
                this._connectHandler.use(item);
            }, this);
        } else {
            this._connectHandler.use(parser);
        }


        this._router = router;

        this._router.use(function(req, res, next) {
            if (!_.isFunction(authenticationHandler) || authenticationHandler(req.params, req.body, req.headers, req.query)) {
                next();
            } else {
                throw 'Authentication Error';
            }
        });

        this._connectHandler.all('/*', this._router);
        this._connectHandler.use(this.handleError.bind(this));

        WebApp.connectHandlers.use(this._settings.pathPrefix, Meteor.bindEnvironment(this._connectHandler));
    }

    /**
     * Handles connect errors
     * @param {Object}   err  The connect error object
     * @param {Object}   req  The connect request object
     * @param {Object}   res  The connect response object
     */
    RestApi.prototype.handleError = function (err, req, res, next) {
        this._logger.error('[rest-api] Error while handling request: ' + err.toString(), {
            error: err,
            request: {
                headers: req.headers,
                hostname: req.hostname,
                ip: req.ip,
                path: req.path,
                params: req.params,
                query: req.query,
                body: req.body
            }
        });

        var status = err.status || 500;
        res.sendStatus(status);
    };
    /**
     * Adds a route for a rest request.
     *
     * Note: handlers should return a json object which will in turn be put in the response.
     *
     * @param {String} url      The url for which to add a router for example /123
     * @param {Object} handlers The object with handlers for the different request types('get', 'post', 'put', 'delete')
     * @param {Function} [get=undefined] The handler to call when there's a get request for the route
     * @param {Function} [post=undefined] The handler to call when there's a post request for the route
     * @param {Function} [put=undefined] The handler to call when there's a put request for the route
     * @param {Function} [delete=undefined] The handler to call when there's a delete request for the route
     *
     *
     */
    RestApi.prototype.add = function (url, handlers) {
        var types = _.map(handlers, function (item, key) {
            return key.toLowerCase();
        });

        var diff = _.difference(types, ['get', 'post', 'put', 'delete']);
        if (diff.length) {
            throw 'Non-existing request type in handlers object: ' + diff;
        }

        _.each(handlers, function (item, key) {
            this._router[key.toLowerCase()](url, this._wrapHandler(item));
        }, this);
    };

    RestApi.prototype._wrapHandler = function (fn) {
        return function (req, res, next) {
            var result = fn(req.params, req.body, req.query);
            res.json(result);
        };
    };

    /**
     * The default settings to be used for the rest-api instance
     * @type {Object}
     */
    RestApi.prototype.defaultSettings = {
        pathPrefix: '/api'
    };

    return RestApi;
}());
