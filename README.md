meteor-rest-api-base
====================

Base rest-api wrapper for connect middleware.

Inject your own middleware or use a wrapping package for example [meteor-rest-api-express](https://github.com/marcodejongh/meteor-rest-api-express)


##Install

```
meteor add gfk:rest-api-base
```

##Use

If you want to use express use ```gfk:rest-api-express``` which extends the constructor of this package and injects express.


```
function auth1 (params, body, header) {
    if (body.apiKey) {
        return checkApiKey(body.apiKey);
    } else {
        return false;
    }
}

restapi = new RestApi(undefined, auth1, console);

var connectMiddleware = Npm.require('someConnectMiddleware');
var connectMiddlewareRouter = Npm.require('something');

var bodyParser = Npm.require('body-parser');
RestApi({}, auth1, console, connectMiddleware, connectMiddlewareRouter, [bodyParser.json()]);

```

global RestApi:true, WebApp:false

## RestApi(settings, authenticationHandler, [logger=console], connectHandler, router, parser)

Wrapper for connect middleware

### Params:

* **Object** *settings* Settings to use for setting up this rest-api
* **Function** *authenticationHandler* The authenticationHandler that will be first called on overy request
* **Object** *[logger=console]* The logger to use
* **Object** *connectHandler* The connect middleware handling the connections for example express gets arguments: parameters, body, header
* **Object** *router* The connect middleware router plugin to handle routing
* **Array|String** *parser* The parser(s) to run on incoming requests

## handleError(err, req, res)

Handles connect errors

### Params:

* **Object** *err* The connect error object
* **Object** *req* The connect request object
* **Object** *res* The connect response object

## add(url, handlers, [get=undefined], [post=undefined], [put=undefined], [delete=undefined])

Adds a route for a rest request.

Note: handlers should return a json object which will in turn be put in the response.

### Params:

* **String** *url* The url for which to add a router for example /123
* **Object** *handlers* The object with handlers for the different request types('get', 'post', 'put', 'delete')
* **Function** *[get=undefined]* The handler to call when there's a get request for the route
* **Function** *[post=undefined]* The handler to call when there's a post request for the route
* **Function** *[put=undefined]* The handler to call when there's a put request for the route
* **Function** *[delete=undefined]* The handler to call when there's a delete request for the route

## defaultSettings

The default settings to be used for the rest-api instance
