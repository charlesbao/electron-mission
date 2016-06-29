var fs = require('fs');
var Path = require('path')
var TmpClient = [];

var jsonObj = JSON.parse(fs.readFileSync('mission.json'));
var ALLClient = jsonObj['client'];
var AllMission = jsonObj['mission'];
// 数组工具类
function minus_Arr(arr1,arr2){
    var arr3 = [];
    for (var i = 0; i < arr1.length; i++) {
        var flag = true;
        for (var j = 0; j < arr2.length; j++) {
            if (arr2[j] == arr1[i]) {
                flag = false;
            }
        }
        if (flag) {
            arr3.push(arr1[i]);
        }
    }
    return arr3;
}


// service 方法
function pushService(socket,data){
    console.log('download',data.name);
    var thePath = Path.join('./tmp/',data.hash);

    if(!fs.existsSync(Path.join(thePath,data.name))){
        fs.writeFileSync(Path.join(thePath,data.name),data.content);
    }else{
        console.log('exist',data.name)
    }
    fs.readdir(thePath,function(err,files){
        socket.emit('continueDownload', {code:200,length:files.length});
    });
    if(!!data.trueName){
        fs.readdir(thePath,function(err,files) {
            socket.broadcast.emit('pushToClient', {
                code:200,
                content:{
                    hash:data.hash,
                    trueName:data.trueName,
                    chunkSize:data.chunkSize,
                    length:files.length,
                    size:data.size,
                    date:new Date().getTime(),
                }
            });
        });
    }
}

function clientService(client){
    console.log('disClient',addClient(client))
}

function addClient(client){
    TmpClient.push(client)
    console.log(TmpClient)
    return minus_Arr(ALLClient,TmpClient)
}
function removeClient(client){
    for(var i = 0; i < TmpClient.length; i ++ ){
        if(TmpClient[i] == client){
            TmpClient.splice(i,1)
        }
    }
    return minus_Arr(ALLClient,TmpClient)
}

function adminService(){
    var jsonObj = JSON.parse(fs.readFileSync('mission.json'));
    ALLClient = jsonObj['client'];
    AllMission = jsonObj['mission'];
}

exports.index = function(req,res){
    res.render('index')
};

exports.fileSend = function(req, res) {
    var hash = req.params.hash;
    var fileName = req.params.name;
    var options = {
        root: Path.join(__dirname,'../tmp/',hash),
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

exports.sockets = function (socket) {

    
    socket.emit('welcome', {content:'welcome to the server'});

    socket.on('who', function (data) {
        switch (data.IM){
            case 'client':
                console.log('con',data.ID)
                socket.clientID = data.ID
                clientService(data.ID);
                break;
            case 'admin':
                console.log('con',data.ID)
                adminService();
                break;
        }
    });

    socket.on('startPush',function(data){
        var thePath = Path.join('./tmp/',data.hash);
        if(!fs.existsSync(thePath))
            fs.mkdirSync(thePath);
        fs.readdir(thePath,function(err,files){
            socket.emit('continueDownload', {code:200,length:files.length});
        })
    });

    socket.on('endPush',function(data){
        console.log('endPush');
        var thePath = Path.join('./tmp/',data.hash);
        fs.readdir(thePath,function(err,files) {
            socket.broadcast.emit('pushToClient', {
                code:200,
                content:{
                    hash:data.hash,
                    trueName:data.trueName,
                    chunkSize:data.chunkSize,
                    length:files.length,
                    size:data.size,
                    date:new Date().getTime(),
                }
            });
        });
    });

    socket.on('clientRecv',function(data){
        console.log('Received',data.IM)
    });

    socket.on('pushItems',function(data){
        pushService(socket,data);
    });
    socket.on('disconnect', function () {
        if(socket.clientID!=undefined){
            //console.log('dis',socket.clientID)
            console.log('disClient',removeClient(socket.clientID))
        }
    });
};
