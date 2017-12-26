/**
 * Created by aven on 2016/10/28.
 */
var Master = require("../index").Master;
var master = new Master({
    weight: 1,
    ip: "127.0.0.1",
    socketPort: "8000",
    masterPort: "8100",//管理服务器的端口
    name: "loginMaster"
});
var times = {};
var time = 0;
master.run({
    login: function (params, socket) {

        var me = this;
        time++;

        if("hello" == params.name && "world" == params.password) {
            var url = me.getMemmber(1);

            if(url) {

                if(!times[url]) {
                    times[url] = 0;
                }
                times[url]++;

                if(time%1000==0 && time!=0) {
console.log(times);
                    times = [];
                }
                socket.emit("loginSuccess", url);
            } else {
                socket.emit("loginError", "Busy.");
            }
        } else {
            socket.emit("loginError", "Invalid username or password.");
        }
    },
    connectionTimeout: function (params, socket) {

        var url = params._url;

        for(var i= 0,ii=this.servers.length;i<ii;i++) {

            if(url == "http://"+this.servers[i].ip+":"+this.servers[i].port) {
                this.servers.splice(i);
                socket.emit("reLogin");
            }
        }
    }
});