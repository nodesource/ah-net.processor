# ah-net.processor

[![build status](https://secure.travis-ci.org/thlorenz/ah-net.processor.png)](http://travis-ci.org/thlorenz/ah-net.processor)

Processes ah-net data obtained from async resources related to network operations.

## Installation

    npm install ah-net.processor

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

-   [API](#api)
    -   [process](#process)
    -   [TcpListenProcessor](#tcplistenprocessor)
    -   [tcpListenProcessor.process](#tcplistenprocessorprocess)
    -   [Sample Return Value](#sample-return-value)
    -   [TcpListenOperation](#tcplistenoperation)
    -   [tcpListenOperation.\_processListen](#tcplistenoperation%5C_processlisten)
    -   [tcpListenOperation.summary](#tcplistenoperationsummary)
    -   [Properties Specific to `server.listen`](#properties-specific-to-serverlisten)
    -   [TcpConnectionProcessor](#tcpconnectionprocessor)
    -   [tcpConnectionProcessor.process](#tcpconnectionprocessorprocess)
    -   [Sample Return Value](#sample-return-value-1)
    -   [TcpClientConnectionProcessor](#tcpclientconnectionprocessor)
    -   [tcpClientConnectionProcessor.process](#tcpclientconnectionprocessorprocess)
    -   [Operations](#operations)
    -   [Sample Return Value](#sample-return-value-2)
    -   [socketInitFrame0Rx](#socketinitframe0rx)
    -   [getaddrinfoInitFrame0Rx](#getaddrinfoinitframe0rx)
    -   [connectInitFrame0Rx](#connectinitframe0rx)
    -   [socketShutdownInitFrame0Rx](#socketshutdowninitframe0rx)
    -   [socketShutdownInitFrame0Rx](#socketshutdowninitframe0rx-1)
    -   [TcpClientConnectionOperation](#tcpclientconnectionoperation)
    -   [tcpClientConnectionOperation.\_processSocket](#tcpclientconnectionoperation%5C_processsocket)
    -   [tcpClientConnectionOperation.\_processGetAddrInfo](#tcpclientconnectionoperation%5C_processgetaddrinfo)
    -   [tcpClientConnectionOperation.\_processConnect](#tcpclientconnectionoperation%5C_processconnect)
    -   [tcpClientConnectionOperation.\_processHttpParser](#tcpclientconnectionoperation%5C_processhttpparser)
    -   [tcpClientConnectionOperation.\_processShutdown](#tcpclientconnectionoperation%5C_processshutdown)
    -   [tcpClientConnectionOperation.summary](#tcpclientconnectionoperationsummary)
    -   [Properties Specific to `tcp client connection`](#properties-specific-to-tcp-client-connection)
    -   [httpParserInitFrame0Rx](#httpparserinitframe0rx)
    -   [HttpConnectionProcessor](#httpconnectionprocessor)
    -   [httpConnectionProcessor.process](#httpconnectionprocessorprocess)
    -   [Sample Return Value](#sample-return-value-3)
    -   [TcpConnectionOperation](#tcpconnectionoperation)
    -   [tcpConnectionOperation.\_processSocket](#tcpconnectionoperation%5C_processsocket)
    -   [tcpConnectionOperation.\_processShutdown](#tcpconnectionoperation%5C_processshutdown)
    -   [tcpConnectionOperation.\_processHttpParser](#tcpconnectionoperation%5C_processhttpparser)
    -   [tcpConnectionOperation.summary](#tcpconnectionoperationsummary)
    -   [Properties Specific to `tcp connection`](#properties-specific-to-tcp-connection)
    -   [processHttpParser](#processhttpparser)
    -   [HttpClientConnectionProcessor](#httpclientconnectionprocessor)
    -   [httpClientConnectionProcessor.process](#httpclientconnectionprocessorprocess)
    -   [Sample Return Value](#sample-return-value-4)
-   [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## [API](https://nodesource.github.io/ah-net.processor)

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### process

Processes all network related activities found inside the supplied `activities`.
Groups them into operations and pulls out meaningful data for each.

Lots of activity data is omitted from the result, therefore make sure to include
activities if you need it.

**Parameters**

-   `includeActivities` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** if `true` the activities are attached to each processed operation (optional, default `false`)

### TcpListenProcessor

Instantiates an tcp server.listen data processor to process data collected via
[nodesource/ah-net](https://github.com/nodesource/ah-net)

Parameters and return value are congruent to the ones explained in
[ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)

### tcpListenProcessor.process

Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).

### Sample Return Value

For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/one-net.createServer.listen.js).

### TcpListenOperation

Processes a group of async activities that represent a tcp server listen operation.
It is used by the [TcpListenProcessor](#tcplistenprocessor) as part of `process`.

Even though the methods here including some private ones are documented, the `TcpListenOperation`
should not be instantiated and used directly.

Parameters are the same as that of the [ah-fs `ReadFileOperation`](https://nodesource.github.io/ah-fs.processor/#readfileoperation).

### tcpListenOperation.\_processListen

The listen contains a lot of useful information about the `server.listen()`
operation.

The last frame of the init stack tells us where `.listen` was called and the
callbacks registered with the server can be found here has well.

If strings were included when the activity resource was captured, we can also
obtain the connection key here.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the listen step, pre-processed by the `ServerListenProcessor`.

### tcpListenOperation.summary

Returns the summary of processing the group into an operation.

The general properties `lifeCycle` and `createdAt` are documented as part of
the ah-fs.processor `ReadFileProcessor`.
Therefore learn more [here](https://nodesource.github.io/ah-fs.processor/#general-operation-properties).

The parameters `{ separateFunctions, mergeFunctions }` and return value
are documented as part of the [ah-fs.processor `ReadFileProcessor`](https://nodesource.github.io/ah-fs.processor/#readfileoperationsummary)
as well.

### Properties Specific to `server.listen`

-   **listen**: see `tcpListenOperation._processListen`

### TcpConnectionProcessor

Instantiates an tcp server connection data processor to process data collected via
[nodesource/ah-net](https://github.com/nodesource/ah-net)

Parameters and return value are congruent to the ones explained in
[ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)

### tcpConnectionProcessor.process

Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).

### Sample Return Value

For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/one-connection.server.js).

### socketShutdownInitFrame0Rx

Sample init stack of socket shutdown:

    "at Socket.onSocketFinish (net.js:240:26)",
    "at emitNone (events.js:86:13)",
    "at Socket.emit (events.js:186:7)",
    "at finishMaybe (_stream_writable.js:509:14)",
    "at endWritable (_stream_writable.js:519:3)"

Code at net.js:240:

`var err = this._handle.shutdown(req);`

### socketShutdownInitFrame0Rx

Sample init stack of socket shutdown,
it is the same as the socket shutdown on the server side:

    "at Socket.onSocketFinish (net.js:240:26)",
    "at emitNone (events.js:86:13)",
    "at Socket.emit (events.js:186:7)",
    "at finishMaybe (_stream_writable.js:509:14)",
    "at endWritable (_stream_writable.js:519:3)"

Code at net.js:240:

`var err = this._handle.shutdown(req);`

### TcpConnectionOperation

Processes a group of async activities that represent a tcp server
connection operation.
It is used by the [TcpConnectionProcessor](#tcpconnectionprocessor) and
the [HttpConnectionProcessor](#httpconnectionprocessor) as part of `process`.

Even though the methods here including some private ones are documented, the `TcpConnectionOperation`
should not be instantiated and used directly.

Parameters are the same as that of the [ah-fs `ReadFileOperation`](https://nodesource.github.io/ah-fs.processor/#readfileoperation).

### tcpConnectionOperation.\_processSocket

The tcp socket is created by core to service a client connection.
It has user functions attached which we extract.

The `created` timestamp helps us define the life cycle of the connection, as it starts
when the socket is created and ends when the related shutdown is destroyed.
Usually we also see two before and after timestamps but those are mainly only related to the
inner workings of core and are ignored for now.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the socket connection, pre-processed by the `TcpConnectionProcessor`.

### tcpConnectionOperation.\_processShutdown

We only obtain the ids and the life cycle information of the shutdown resource.
We do have an initStack, but that just points to core code.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the shutdown of the tcp server, pre-processed by the `TcpConnectionProcessor`.

### tcpConnectionOperation.\_processHttpParser

This function is only used when we are dealing with an http connection which
has an http parser.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the http parser

### tcpConnectionOperation.\_processTls

This function is only used when we are dealing with a tls connection.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the tls aspect of the connection

### tcpConnectionOperation.summary

Returns the summary of processing the group into an operation.

The general properties `lifeCycle` and `createdAt` are documented as part of
the ah-fs.processor `ReadFileProcessor`.
Therefore learn more [here](https://nodesource.github.io/ah-fs.processor/#general-operation-properties).

The parameters `{ separateFunctions, mergeFunctions }` and return value
are documented as part of the [ah-fs.processor `ReadFileProcessor`](https://nodesource.github.io/ah-fs.processor/#readfileoperationsummary)
as well.

### Properties Specific to `tcp connection`

-   **socket**: see `tcpConnectionOperation._processSocket`
-   **httpParser**: see `tcpConnectionOperation._processHttpParser`
-   **shutdown**: see `tcpConnectionOperation._processShutdown`

### TcpClientConnectionProcessor

Instantiates an `net.connect` data processor to process data collected via
[nodesource/ah-net](https://github.com/nodesource/ah-net)

Parameters and return value are congruent to the ones explained in
[ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)

### tcpClientConnectionProcessor.process

Processes the supplied async activities into client connection operations.

### Operations

Here we consider full operation connect operations only, i.e. we group
together 4 operations.

-   **socket**: has data about the connection socket being created
-   **getaddrinfo**: has data about the dns lookup of the server address
-   **connect**: has data about the established the connection, it is
    alive as long as data is transferred between client and server
-   **shutdown**: has data about the shutdown of the connection after all
    data was transferred

### Sample Return Value

For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/one-connection.client.js).

### socketInitFrame0Rx

Sample init stack of socket intialization that was created via
`net.connect()`:

    "at Socket.connect (net.js:932:40)",
    "at Object.exports.connect.exports.createConnection (net.js:75:35)",
    "at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:19:4)",
    "at Module._compile (module.js:571:32)",
    "at Object.Module._extensions..js (module.js:580:10)"

Code at net.js:932:

`this._handle = pipe ? new Pipe() : new TCP();`

The 3rd frame from the top tells us where the connection was created.

TODO: this may be different when we create a socket with the slighly lower leve
API (see: <https://nodejs.org/api/net.html#net_class_net_socket>)
Therefore we need to test/adapt for this case as well.

### getaddrinfoInitFrame0Rx

Sample init stack of getAddrInfo lookup:

    "at lookup (dns.js:182:19)",
    "at lookupAndConnect (net.js:1053:3)",
    "at Socket.connect (net.js:948:5)",
    "at Object.exports.connect.exports.createConnection (net.js:75:35)",
    "at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:19:4)"

Code at dns.js:182

`var err = cares.getaddrinfo(req, hostname, family, hints);`

Code at net.js 1053:

`lookup(host, dnsopts, function emitLookup(err, ip, addressType)`

Sample init stack of getAddrInfo lookup for TLS connections:

    "at lookup (dns.js:182:19)",
    "at lookupAndConnect (net.js:1053:3)",
    "at TLSSocket.Socket.connect (net.js:996:5)",
    "at Object.exports.connect (_tls_wrap.js:1078:12)",
    "at Socket.onserverListening (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.client.js:91:10)"

Code at net.js:996

`lookupAndConnect(this, options);`

In both cases the bottom parts are part of the Socket connect stack and last
in stack tells us where that connection was created.

### connectInitFrame0Rx

Sample init stack of tcp client connect:

    "at connect (net.js:873:26)",
    "at emitLookup (net.js:1023:7)",
    "at GetAddrInfoReqWrap.asyncCallback [as callback] (dns.js:62:16)",
    "at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:81:10)"

Code at net.js:873
`err = self._handle.connect(req, address, port);`

We can clearly see here that it is triggered by the address lookup.
The frame1 regex only works in that case as well, i.e. if in some
cases no lookup is performed we need to write a smaller processor.

Sample init stack of tls client connect:

    "at TLSWrap.methodProxy [as connect6] (_tls_wrap.js:327:33)",
    "at connect (net.js:923:26)",
    "at emitLookup (net.js:1072:7)",
    "at GetAddrInfoReqWrap.asyncCallback [as callback] (dns.js:83:16)",
    "at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:97:10)"

It is basically the same as a tcp connect init except we have an extra tls
related frame. Therefore we use the same regexes, move one frame down

### TcpClientConnectionOperation

Processes a group of async activities that represent a tcp client
connection operation.
It is used by the
[TcpClientConnectionProcessor](#tcpclientconnectionprocessor)
and [HttpClientConnectionProcessor](#httpclientconnectionprocessor) as part of `process`.

Even though the methods here including some private ones are documented, the `TcpConnectionOperation`
should not be instantiated and used directly.

Parameters are the same as that of the [ah-fs `ReadFileOperation`](https://nodesource.github.io/ah-fs.processor/#readfileoperation).

### tcpClientConnectionOperation.\_processSocket

The socket creation activity has three important information points.

We can glean from the stack trace where the client connection was created.
We also take the init timestamp to be the beginning of the life of the
client connection.
On top of that the associated user functions were attached to the owner
as event listeners.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the _establish socket_ step

### tcpClientConnectionOperation.\_processGetAddrInfo

The dns resolution operation (GetAddrInfo) doesn't give us much info, however it
gives us another option to get at the line of code that established the
socket connection, i.e. called `connect`.

We only use this option if we couldn't get that information via `_processSocket`.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the dns lookup step

### tcpClientConnectionOperation.\_processConnect

The established connection gives us no useful info, so we just record its ids
and move on.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the established connection

### tcpClientConnectionOperation.\_processHttpParser

This function is only used when we are dealing with an http connection which
has an http parser.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the http parser

### tcpClientConnectionOperation.\_processTls

This function is only used when we are dealing with a tls connection which.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the tls wrap

### tcpClientConnectionOperation.\_processShutdown

As is the case for the `TcpConnectionOperation` we can only obtain the ids
and the life cycle information of the shutdown resource.
We do have an initStack, but that just points to core code.

However we also pull the `destroyed` timestamp from it in order to establish the
full lifetime of the tcp client connection which ends when its shutdown completes.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the shutdown of the tcp client connection

### tcpClientConnectionOperation.summary

Returns the summary of processing the group into an operation.

The general properties `lifeCycle` and `createdAt` are documented as part of
the ah-fs.processor `ReadFileProcessor`.
Therefore learn more [here](https://nodesource.github.io/ah-fs.processor/#general-operation-properties).

The parameters `{ separateFunctions, mergeFunctions }` and return value
are documented as part of the [ah-fs.processor `ReadFileProcessor`](https://nodesource.github.io/ah-fs.processor/#readfileoperationsummary)
as well.

### Properties Specific to `tcp client connection`

-   **socket**: see `tcpClientConnectionOperation._processSocket`
-   **getaddrinfo**: see `tcpClientConnectionOperation._processGetAddrInfo`
-   **connect**: see `tcpClientConnectionOperation._processConnect`
-   **httpparser**: see `tcpClientConnectionOperation._processHttpParser`
-   **tls**: see `tcpClientConnectionOperation._processTls`
-   **shutdown**: see `tcpClientConnectionOperation._processShutdown`

### processHttpParser

The http parser resource gives us a huge amount of information.
We have access to the socket here (same as we process in \_processSocket).
The socket allows grouping by the but also is captured at a point where it
has the \_httpMessage (unlike the socket we process above).

We also have access to the \_httpMessage and the incoming message here.
We do pick and choose only a few of those as to not overwhelm the user, on
top of that the ah-net pre-processor already removed some info in order to
keep the data a decent size.
Ergo here we could get lots more data in the future should we need to.

**Parameters**

-   `info` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** information about the http parser of an http server
    or client, pre-processed by the `HttpConnectionProcessor` or `HttpClientConnectionProcessor`.

### httpParserInitFrame0Rx

Sample init stack of http parser we are interested in:

    "at Server.connectionListener (_http_server.js:302:10)",
    "at emitOne (events.js:121:13)",
    "at Server.emit (events.js:216:7)",
    "at TCP.onconnection (net.js:1535:8)"

Code at \_http_server.js:302:

`parser.reinitialize(HTTPParser.REQUEST);`

The parser we aren't interested in is allocated right before
at \_http_server.js:301:

`var parser = parsers.alloc();`

### HttpConnectionProcessor

Instantiates an http server connection data processor to process data collected via
[nodesource/ah-net](https://github.com/nodesource/ah-net)

Parameters and return value are congruent to the ones explained in
[ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)

### httpConnectionProcessor.process

Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).

### Sample Return Value

For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/http.one-connection.server.js).

### HttpClientConnectionProcessor

Instantiates an http client connection data processor to process data collected via
[nodesource/ah-net](https://github.com/nodesource/ah-net)

Parameters and return value are congruent to the ones explained in
[ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)

### httpClientConnectionProcessor.process

Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).

### Sample Return Value

For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/http.one-connection.client.js).

### tlsSocketInitFrame0Rx

Sample init stack of tls socket that was created via
`tls.connect`:

    "at TLSSocket._wrapHandle (_tls_wrap.js:372:42)",
    "at new TLSSocket (_tls_wrap.js:290:18)",
    "at Object.exports.connect (_tls_wrap.js:1051:16)",
    "at Socket.onserverListening (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.client.js:91:10)",
    "at emitOne (events.js:126:20)"

Code at net.js:372:

`handle = options.pipe ? new Pipe() : new TCP();`

The 4th frame from the top tells use where it was created.

### TlsClientConnectionProcessor

Instantiates an tls client connection data processor to process data collected via
[nodesource/ah-net](https://github.com/nodesource/ah-net)

Parameters and return value are congruent to the ones explained in
[ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)

### tlsClientConnectionProcessor.process

Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).

### Sample Return Value

For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/tls.one-connection.noshutdown.client.js).

### TlsConnectionProcessor

Instantiates an tls server connection data processor to process data collected via
[nodesource/ah-net](https://github.com/nodesource/ah-net)

Parameters and return value are congruent to the ones explained in
[ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)

### tlsConnectionProcessor.process

Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).

### Sample Return Value

For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/tls.one-connection.server.js).

## License

MIT
