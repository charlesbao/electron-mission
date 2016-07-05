const io = require('socket.io-client');
const api = require('./api');
const {ipcRenderer} = require('electron');
const Constants = require('./constants')

let Socket = {

  url:Constants.URL,
  id:null,
  socket:null,

  init:function(id){

    Socket.id = id;

    Socket.socket = io(Socket.url);
    initSocket(Socket.socket);
    console.info('socket started!')

  },
  reInit:function(){
    let url = Socket.url;
    let id = Socket.id;

    Socket.destroy();
    Socket.init(url,id)
  },
  destroy:function(){
    Socket.socket.removeAllListeners();
    Socket.socket = null;
    console.info('socket destroyed!')
  },
  removeListener: function(event){
    console.info(event,'removeListener');
    Socket.socket.off(event);
  },
  addListener: function(event,callback){
    console.info(event,'addListener');
    Socket.socket.on(event,callback);
  }
};

function initSocket(socket) {

  socket.on(Constants.SOCKET.ON._CONNECT, function () {
    socket.emit(Constants.SOCKET.EMIT.WHO, {IM: Constants.SOCKET.IM, ID: Socket.id });
  });

  socket.on(Constants.SOCKET.ON.WELCOME, function (data) {
    console.log(data.content)
  });

  socket.on(Constants.SOCKET.ON._RECONNECT, function() {
    console.log(Constants.SOCKET.ON._RECONNECT);
  });

  socket.on(Constants.SOCKET.ON._DISCONNECT, function () {
    console.info(Constants.SOCKET.ON._DISCONNECT);
  });

  socket.on(Constants.SOCKET.ON._ERROR, function (err) {
    console.log(err);
  });

  socket.on(Constants.SOCKET.ON.EMIGRATE, function(data){
    let content = data.content;
    Socket.id = content['id'] || Socket.id;
    Socket.url = content['url'] || Socket.url;
    Socket.reInit()
  });

  socket.on(Constants.SOCKET.ON.PUSH_MISSION,function(data){
    socket.emit(Constants.SOCKET.EMIT.CLIENT_RECV, {
      IM:'client',
      ID:Socket.id
    });
    api.setMission(data.content)
  });
}

module.exports = Socket;
