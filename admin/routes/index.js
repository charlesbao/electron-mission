var fs = require('fs');
var Path = require('path')
var Utils = require('../utils')
var Store = require('../utils/store')
var Constants = require('../utils/constants');
var moment = require('moment');

exports.init = function(){
    Store.initMission()
};

exports.sockets = function (socket) {

    socket.emit(Constants.SOCKET.EMIT.WELCOME, {
        content:Constants.SOCKET.EMIT.WELCOME
    });

    socket.on(Constants.SOCKET.ON.WHO, function (data) {
        switch (data.IM){
            case Constants.WHO.CLIENT:
                console.log(Constants.WHO.CLIENT,data.ID);
                socket.clientID = data.ID;
                Store.setClientState(socket.clientID,Constants.CLIENT.ONLINE);
                socket.emit(Constants.SOCKET.EMIT.PUSH_MISSION, {
                    code:200,
                    content:Store.getMission()
                });
                socket.join(Constants.WHO.CLIENT);
                socket.to(Constants.WHO.ADMIN).emit(Constants.SOCKET.EMIT.SHOW_FIELD,{
                    '#online':Store.getClient(Constants.CLIENT.ONLINE),
                    '#offline':Store.getClient(Constants.CLIENT.OFFLINE)
                });
                break;
            case Constants.WHO.ADMIN:
                console.log(Constants.WHO.ADMIN,data.ID);
                socket.join(Constants.WHO.ADMIN);
                socket.emit(Constants.SOCKET.EMIT.SHOW_FIELD,{
                    '#online':Store.getClient(Constants.CLIENT.ONLINE),
                    '#offline':Store.getClient(Constants.CLIENT.OFFLINE)
                });
                break;
        }
    });

    socket.on(Constants.SOCKET.ON.START_PUSH,function(data){
        Utils.checkFolder();
        var thePath = Path.join(Constants.TMP_FOLDER,data.hash);
        if(!fs.existsSync(thePath)){
            fs.mkdirSync(thePath);
        }else{
            if(Store.getMission()[data.name] && Store.getMission()[data.name]['chunkSize'] != data.chunkSize){
                Utils.deleteFolderRecursive(thePath);
                fs.mkdirSync(thePath);
            }
        }
        
        fs.readdir(thePath,function(err,files){
            socket.emit(Constants.SOCKET.EMIT.CONTINUE_PUSH, {files:files});
        })
    });

    socket.on(Constants.SOCKET.ON.END_PUSH,function(data){
        console.log(Constants.SOCKET.ON.END_PUSH);
        Store.pushMission({
            hash: data.hash,
            trueName: data.trueName,
            chunkSize: data.chunkSize,
            number: data.number,
            size: data.size,
            date: moment().format('YYYY-MM-DD HH:mm'),
            type: data.type
        });
        socket.to(Constants.WHO.CLIENT).emit(Constants.SOCKET.EMIT.PUSH_MISSION, {
            content:Store.getMission()
        });
    });

    socket.on(Constants.SOCKET.ON.PUSH_ITEMS,function(data){
        var thePath = Path.join(Constants.TMP_FOLDER,data.hash);
        var theFile = Path.join(thePath,data.name)
        if(!fs.existsSync(theFile)){
            console.log(Constants.SOCKET.ON.PUSH_ITEMS,data.name);
            fs.writeFileSync(Path.join(thePath,data.name),data.content);
        }
        if(data['stop']){
            fs.readdir(thePath,function(err,files){
                socket.emit(Constants.SOCKET.EMIT.CONTINUE_PUSH, {files:files});
            });
        }
    });

    socket.on(Constants.SOCKET.ON.CLIENT_RECV,function(data){
        console.log('Received',data.IM)
    });

    socket.on(Constants.SOCKET.ON._DISCONNECT, function () {
        if(socket['clientID'] != undefined){
            Store.setClientState(socket.clientID,Constants.CLIENT.OFFLINE)

            socket.to(Constants.WHO.ADMIN).emit(Constants.SOCKET.EMIT.SHOW_FIELD,{
                '#online':Store.getClient(Constants.CLIENT.ONLINE),
                '#offline':Store.getClient(Constants.CLIENT.OFFLINE)
            });

            console.log(Constants.SOCKET.ON._DISCONNECT,socket.clientID)
        }
    });

    socket.on(Constants.SOCKET.ON.CLEAR_MISSION, function(){
        Store.clearMission();
        socket.to(Constants.WHO.CLIENT).emit(Constants.SOCKET.EMIT.PUSH_MISSION,{
            content:{}
        })
    })
};


exports.index = function(req,res){
    res.render('index')
};

exports.fileSend = function(req, res) {
    var hash = req.params.hash;
    var fileName = req.params.name;
    var options = {
        root: Path.join(Constants.TMP_FOLDER,hash),
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.log('err',err);
            res.status(err.status).end();
        }
        else {
            console.log('Sent:', fileName);
        }
    });
};
