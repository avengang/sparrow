/**
 * Created by aven on 2016/10/28.
 */
function listen(port, fn, caller) {

console.log("server listen on:"+port);
    var http = require("http");
    http.createServer(function (request, response) {
        var reg = /^\/\?url=([\w|\/|\d|\.|:]*)&ip=([\d|\.]*)&port=(\d*)&type=(\w*)&param=(\w*)&weight=([\d|\.]*)&maxClientCount=(\d*)$/;

        if(reg.test(request.url)) {
            var url = RegExp.$1;
            var ip = RegExp.$2;
            var port = RegExp.$3;
            var type = RegExp.$4;
            var param = RegExp.$5;
            var weight = RegExp.$6;
            var maxClientCount = RegExp.$7;
            fn && fn(url, ip, port, type, param, weight, maxClientCount);
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write(""+caller.clientCount);
            response.end();
        }
    }).listen(port);
}
function talk(targetUrl, myUrl, myIp, myPort, type, param, weight, maxClientCount, successFn, errorFn) {

    var url = targetUrl + "?url=" + myUrl + "&ip=" + myIp + "&port=" + myPort + "&type=" + type + "&param=" + param + "&weight=" + weight + "&maxClientCount=" + maxClientCount;
    var request = require("request");
    request(url, function (error, res, body) {

        if(error) {
            errorFn && errorFn(error);
            return;
        }
        if(body && body) {
            successFn && successFn(body);
        }
    })
}
exports.listen = listen;
exports.talk = talk;