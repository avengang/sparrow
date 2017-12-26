/**
 * Created by aven on 2016/10/28.
 */
var Slave = require("../index").Slave;
var slave = new Slave({
    weight: 1,
    masterUrl: "http://127.0.0.1:8100",
    ip: "127.0.0.1",
    socketPort: "8001",
    slavePort: "8101",//管理服务器的端口
    name: "game1",
    maxClientCount: 100
});
slave.run({
    game: function (socket) {

        socket.emit("gameSuccess", this.name);
    }
});