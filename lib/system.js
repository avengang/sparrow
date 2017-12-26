/**
 * Created by aven on 2016/10/28.
 */
Object.prototype.$extends = function (SuperClass) {

    if (!Object.create) {
        Object.create = function (proto) {
            function F() {

                F.prototype = proto;
                return new F;
            }
        }
    }
    var oldPrototype = this.prototype;
    this.prototype = Object.create(SuperClass.prototype);

    for (key in oldPrototype) {
        oldPrototype[key] != undefined && (this.prototype[key] = oldPrototype[key]);
    }
    this.prototype.__parent__ = SuperClass;
};
Object.prototype.$super = function () {

    var param = arguments[0];
    var arg = arguments;

    while (param) {

        if (!param.callee) {
            break;
        }
        arg = param;
        param = param[0];
    }

    var parent = this;

    while (parent) {

        for (var key in parent) {//首次子类调用该方法

            if (arguments[0].callee == parent[key]) {//找到对应父类
                arg.callee = arguments[0].callee;
                parent.__parent__.prototype[key].apply(this, arg);
                return;
            }
        }
        for (var key in parent.prototype) {

            if (arguments[0].callee == parent.prototype[key]) {//找到对应父类
                arg.callee = arguments[0].callee;
                parent.prototype.__parent__.prototype[key].apply(this, arg);
                return;
            }
        }
        parent = parent.__parent__;
    }
};
Object.defineProperties(Object.prototype, {
    '$extends': {
        enumerable: false,
        writable: false
    },
    '$super': {
        enumerable: false,
        writable: false
    }
});
var EventListener = function () {
};
EventListener.prototype = {
    events: {},
    handle: function (eventName, handler) {

        if (!this.events[eventName] || !isArray(this.events[eventName])) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);
        return handler;
    },
    remove: function (handler, eventName) {

        if (eventName) {
            var event = this.events[eventName];

            if (!event || !isArray(event)) {
                return;
            }

            for (var i = 0, ii = event.length; i < ii; i++) {

                if (event[i] == handler) {
                    event.splice(i, 1);
                }
            }
        } else {

            for (var name in this.events) {

                for (var j = 0, jj = this.events[name].length; j < jj; j++) {

                    if (event[i] == handler) {
                        event.splice(i, 1);
                    }
                }
            }
        }
    },

    fire: function (eventName, param) {

        var event = this.events[eventName];

        if (!event) {
            return;
        }

        for (var i = 0, ii = event.length; i < ii; i++) {

            event[i] && event[i](param);
        }
    }
}
global.$eventListener = new EventListener();

function Master(params) {

    this.weight = params.weight;
    this.heartbeatTime = params.heartbeatTime || 10000;
    this.ip = params.ip;
    this.socketPort = params.socketPort;
    this.masterPort = params.masterPort;
    this.name = params.name;
}
Master.prototype = {
    weight: 1,
    heartbeatTime: 10000,
    servers: [],
    ip: "",
    socketPort: "",
    masterPort: "",//管理服务器的端口
    name: "",
    socket: null,
    clientCount: 0,
    maxClientCount: 1000,
    setWeight: function (weight) {

        this.weight = this.weight || 1;
    },
    /**
     * 获取成员的方法
     * @returns {*}
     */
    getMemmber: function (time) {

        if(time>=3) {
            return false;
        }
        var totalWeight = 0;

        for(var i= 0,ii=this.servers.length;i<ii;i++) {
            var w = parseFloat(this.servers[i].weight);
            totalWeight += w;
            this.servers[i].range = totalWeight;
        }
        var r = Math.random() * totalWeight;

        for(var i= 0,ii=this.servers.length;i<ii;i++) {
            var w = this.servers[i].range;

            if(i==0) {

                if(r>=0 && r<w) {

                    if(+this.servers[i].clientCount < +this.servers[i].maxClientCount) {
                        return "http://"+this.servers[0].ip+":"+this.servers[0].port;
                    }
                    return this.getMemmber(time+1);
                }
            } else {

                if(r>=this.servers[i-1].range && r<w) {

                    if(+this.servers[i].clientCount < +this.servers[i].maxClientCount) {
                        return "http://"+this.servers[i].ip+":"+this.servers[i].port;
                    }
                    return this.getMemmber(time+1);
                }
            }
        }
    },
    run: function (options) {

        var me = this;
        var util = require("./util");
        var io = require("socket.io").listen(this.socketPort);
        io.sockets.on("connection", function (socket) {

            me.clientCount++;

            for(var option in options) {

                (function (option, options) {

                    socket.on(option, function () {

                        var optionParam = [];

                        for(var i= 0,ii=arguments.length;i<ii;i++) {
                            optionParam.push(arguments[i]);
                        }
                        optionParam.push(socket);
                        options[option].apply(me, optionParam);
                    });
                })(option, options);
            }
            socket.on("disconnect", function () {

                me.clientCount--;
            });
        });
        util.listen(this.masterPort, function (url, ip, port, type, name, weight, maxClientCount) {

            if("exit" == type) {

                for(var i= 0,ii=me.servers.length;i<ii;i++) {

                    if(me.servers[i].url==url && me.servers[i].ip==ip) {
console.log("name send exit command.");
                        me.servers.splice(i);
                        break;
                    }
                }
            } else if("register" == type) {
                me.servers.push({
                    url: url,
                    ip: ip,
                    port: port,
                    type: type,
                    name: name,
                    weight: weight,
                    maxClientCount: maxClientCount,
                    clientCount: 0
                });
                $eventListener.fire("newMemmber", {
                    url: url,
                    ip: ip,
                    port: port,
                    type: type,
                    name: name,
                    weight: weight,
                    maxClientCount: maxClientCount,
                    clientCount: 0
                });
            }
        }, me);
        var interval = setInterval(function () {

            if (!me.weight) {
                clearInterval(interval);
            }

            for(var i= 0,ii=me.servers.length;i<ii;i++) {
                (function (index) {
                    util.talk(me.servers[i].url, "", "", "", "heartbeat", "", "", "", function (respData) {

                        me.servers[index].clientCount = respData;
                    }, function (err) {

console.log(me.servers[index].name+" out!");
                        $eventListener.fire("out", {
                            url: me.servers[index].url,
                            ip: me.servers[index].ip,
                            port: me.servers[index].port,
                            type: me.servers[index].type,
                            name: me.servers[index].name
                        });
                        me.servers.splice(index);
                    })
                })(i);
            }
        }, this.heartbeatTime);
    }
};
Object.defineProperties(Master.prototype, {
    'servers': {
        enumerable: false,
        writable: false
    }
});
var Slave = function (params) {

    this.weight = params.weight;
    this.masterUrl = params.masterUrl;
    this.ip = params.ip;
    this.socketPort = params.socketPort;
    this.slavePort = params.slavePort;
    this.name = params.name;
    this.maxClientCount = params.maxClientCount;
}
Slave.prototype = {
    weight: 1,
    masterUrl: "",
    ip: "",
    socketPort: "",
    slavePort: "",
    name: "",
    socket: null,
    clientCount: 0,
    clients: [],
    maxClientCount: 1000,
    setWeight: function (weight) {

        this.weight = weight || 1;
    },
    exit: function () {

        var util = require("./util");
        util.talk(this.masterUrl, "http://"+this.ip + ":" + this.slavePort, this.ip, this.socketPort, "exit", this.name, this.weight, this.maxClientCount, function (resData) {

            $eventListener.fire("exit");
        });
    },
    run: function (options) {

        var me = this;
        var util = require("./util");
        var process = require("process");
        var io = require("socket.io").listen(this.socketPort);
//        process.on('SIGINT', function() {
//
//console.log('Got SIGINT.  Press Control-D/Control-C to exit.');
//            me.exit();
//            process.exit(0);
//        });
//        process.on('exit', function () {
//
//            //me.exit();
//        });
        process.on('uncaughtException', function (err) {

console.log('Caught exception: ' + err);
        });
        io.sockets.on("connection", function (socket) {

            me.clientCount++;
            me.clients.push(socket);

            for(var option in options) {
                var optionFn = options[option];
                socket.on(option, function () {

                    var optionParam = [];

                    for(var i= 0,ii=arguments.length;i<ii;i++) {
                        optionParam.push(arguments[i]);
                    }
                    optionParam.push(socket);
                    optionFn.apply(me, optionParam);
                });
            }
            socket.on("disconnect", function () {

                for(var i= 0,ii=me.clients.length;i<ii;i++) {

                    if(me.clients[i] == socket) {
                        me.clients.splice(i);
                    }
                }
                me.clientCount--;
            });
        });
        util.listen(this.slavePort, function (url, ip, port, type, name) {

            if ("heartbeat" == type) {
                $eventListener.fire("heartbeat");
            }
        }, me);
        util.talk(this.masterUrl, "http://"+this.ip + ":" + this.slavePort, this.ip, this.socketPort, "register", this.name, this.weight, this.maxClientCount, function (resData) {

            $eventListener.fire("registerSuccess");
        });
    }
};
exports.Master = Master;
exports.Slave = Slave;