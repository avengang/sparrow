/**
 * Created by aven on 2016/10/28.
 */
var Slave = require("../index").Slave;
var slave = new Slave({
    weight: 4,
    masterUrl: "http://127.0.0.1:8100",
    ip: "127.0.0.1",
    socketPort: "8004",
    slavePort: "8104",//管理服务器的端口
    name: "game4",
    maxClientCount: 100
});
slave.run({
    game: function (socket) {

        socket.emit("gameSuccess", this.name);
    }
});