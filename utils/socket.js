const io = require('socket.io-client');
const api = require('./api');
const url = 'http://127.0.0.1:8320';

let Socket = {

  url:url,
  id:null,

  connected:false,
  error:false,
  socket:null,
  downloading:false,
  mission:[],

  init:function(url,id){

    Socket.url = url;
    Socket.id = id;

    Socket.socket = io(url);
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
  console.log(socket)
  socket.on('connect', function () {

    socket.emit('who', {IM: 'client', ID: Socket.id });
    Socket.connected = true;

  });
  socket.on('welcome', function (data) {
    //输出欢迎文字
    console.log(data.content)
    api.checkFolder();
    Socket.mission = api.getMission()
  });
  socket.on('reconnect', function() {
    console.log("reconnect");
  });
  socket.on('disconnect', function () {
    console.info('disconnect');
    Socket.connected = false;
  });

  socket.on('error', function (err) {
    console.log(err);
    Socket.error = true;
  });

  socket.on('emigrate', function(data){
    let content = data.content;
    Socket.id = content['id'] || Socket.id;
    Socket.url = content['url'] || Socket.url;
    Socket.reInit()
  })
}

module.exports = Socket;
