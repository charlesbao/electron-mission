var fs = require('fs');
var Path = require('path')
var Utils = require('../utils')
var Store = require('../utils/store')
var Constants = require('../utils/constants')

exports.init = function(){
    Store.initMission()
};

exports.sockets = function (socket) {

    socket.emit('welcome', {
        content:'welcome to the server'
    });

    socket.on('who', function (data) {
        switch (data.IM){
            case Constants.WHO.CLIENT:
                console.log(Constants.WHO.CLIENT,data.ID);
                socket.clientID = data.ID;
                Store.setClientState(socket.clientID,Constants.CLIENT.ONLINE);
                socket.emit('pushMission', {
                    code:200,
                    content:Store.getMission()
                });
                break;
            case Constants.WHO.ADMIN:
                console.log(Constants.WHO.ADMIN,data.ID)
                break;
        }
    });

    socket.on('startPush',function(data){
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
            socket.emit('continue', {code:200,files:files});
        })
    });

    socket.on('endPush',function(data){
        console.log('endPush');
        Store.setMission(data.trueName,{
            hash: data.hash,
            trueName: data.trueName,
            chunkSize: data.chunkSize,
            number: data.number,
            size: data.size,
            date: new Date().getTime(),
            type: data.type
        });
        socket.broadcast.emit('pushMission', {
            code:200,
            content:Store.getMission()
        });
    });

    socket.on('pushItems',function(data){
        var thePath = Path.join(Constants.TMP_FOLDER,data.hash);
        var theFile = Path.join(thePath,data.name)
        if(!fs.existsSync(theFile)){
            console.log('download',data.name);
            fs.writeFileSync(Path.join(thePath,data.name),data.content);
        }
        if(data['stop']){
            fs.readdir(thePath,function(err,files){
                socket.emit('continue', {code:200,files:files});
            });
        }
    });

    socket.on('clientRecv',function(data){
        console.log('Received',data.IM)
    });

    socket.on('disconnect', function () {
        if(socket['clientID'] != undefined){
            Store.setClientState(socket.clientID,Constants.CLIENT.OFFLINE)
            console.log('disClient',socket.clientID)
        }
    });

    socket.on('clearMission', function(){
        Store.clearMission();
        socket.broadcast.emit('pushMission',{
            code:200,
            content:{}
        })
    })

    socket.on('showField', function(){
        socket.emit('showField',{
            '#online':Store.getClient(Constants.CLIENT.ONLINE),
            '#offline':Store.getClient(Constants.CLIENT.OFFLINE)
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
