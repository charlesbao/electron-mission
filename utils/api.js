const {ipcRenderer} = require('electron');
const fs = require('fs');
const Path = require('path');
const Url = require('url');
const Constants = require('./Constants');

function deleteFolderRecursive(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                try{
                    fs.unlinkSync(curPath);
                }catch (err){
                    console.log('warn:'+err);
                }
            }
        });
        fs.rmdirSync(path);
    }
}

function compile(AllMission){
    console.log('start mapping');
    //开始遍历节目
    let files = fs.readdirSync(Constants.FILES_FOLDER);

    for (let trueName in AllMission) {
        let exist = false;

        for (let i = 0; i < files.length; i++) {
            //如果节目状态显示未完成，则进行下步操作
            if (trueName == files[i]) {
                let theFile = Path.join(Constants.FILES_FOLDER,files[i]);
                if(fs.lstatSync(theFile).size == AllMission[trueName]['size']){
                    exist = true;
                }
                break;
            }
        }
        if(!exist)pushDownloadList(AllMission[trueName])
    }
    console.log('complete mapping');
    sendDownload()
}

function pushDownloadList(data){

    let thePath = Path.join(Constants.TMP_FOLDER,data['hash']);
    let downloadLength = data['number'];
    let trueName = data['trueName'];
    let downloadList = [];

    if(!fs.existsSync(thePath))fs.mkdirSync(thePath);
    let files = fs.readdirSync(thePath);

    for(let x = 0; x < downloadLength; x++){

        let exist = false;
        let downloadName = trueName + '.' + x.toString();

        for(let z = 0; z < files.length; z++){
            //检查分包是否存在
            if(files[z] == downloadName){
                let theFile = Path.join(thePath,files[z]);
                //检查分包大小是否正确
                if(fs.lstatSync(theFile).size == data['chunkSize']
                    || fs.lstatSync(theFile).size == data['size']%data['chunkSize'])
                    exist = true;
                break;
            }
        }
        if(!exist)downloadList.push(downloadName)
    }
    if(downloadList.length != 0){
        api.downloadDict[data['hash']] = downloadList;
    }else{
        combineTmp(data['hash'])
    }
}

function sendDownload(){
    let downloadDict = api.downloadDict;
    if(isEmptyObject(downloadDict)){
        return finishDownload()
    }else{
        for(let hash in downloadDict){
            let downloadList = downloadDict[hash];
            for(let i in downloadList){
                let theUrl = Url.resolve(Constants.DOWNLOAD_URL,hash)+'/'+downloadList[i];
                let thePath = Path.join(Constants.TMP_FOLDER,hash,downloadList[i]);
                console.info('download',downloadList[i])
                return ipcRenderer.send('download',{
                    path:thePath,
                    url:theUrl,
                    hash:hash
                });
            }
        }
    }
}

function finishDownload(){
    let files = fs.readdirSync(Constants.FILES_FOLDER);
    for (let i = 0; i < files.length; i++) {
        let trueName = files[i]
        if(!api.Mission[trueName]){
            fs.unlinkSync(Path.join(Constants.FILES_FOLDER,files[i]))
        }
    }
    deleteFolderRecursive(Constants.TMP_FOLDER);
    console.info('finish')
}

function combineTmp(hash){
    let thePath = Path.join(Constants.TMP_FOLDER,hash);

    let files = fs.readdirSync(thePath);
    let output = [];
    for (let i = 0; i < files.length; i++) {
        let theFile = Path.join(thePath,files[i]);
        output.push(fs.readFileSync(theFile));
    }
    let rep = files[0].split('.');rep.pop();
    let trueName = rep.join('.');

    let filePath = Path.join(Constants.FILES_FOLDER,trueName);
    fs.writeFileSync(filePath,Buffer.concat(output));
    deleteFolderRecursive(thePath);
}

function isEmptyObject (obj){
    return obj == null;
}

let api = {
    downloadDict:{},
    AllMission:null,
    Mission:null,

    getAllMission:function (){
        if(isEmptyObject(api.AllMission)){
            api.AllMission = JSON.parse(fs.readFileSync(Constants.MISSION_PATH))
        }
        return api.AllMission
    },

    checkFolder:function(){
        if(!fs.existsSync(Constants.ASSETS_PATH))fs.mkdirSync(Constants.ASSETS_PATH);
        if(!fs.existsSync(Constants.TMP_FOLDER))fs.mkdirSync(Constants.TMP_FOLDER);
        if(!fs.existsSync(Constants.FILES_FOLDER))fs.mkdirSync(Constants.FILES_FOLDER);
    },

    compileMissions: function(){
        api.checkFolder();

        let AllMission = api.getMissions();
        return compile(AllMission)

    },
    downloadMission: function(hash,name,err){
        if(!err){
            let downloadList = api.downloadDict[hash];
            for(let i in downloadList){
                if(name == downloadList[i]){
                    api.downloadDict[hash].splice(i,1);
                    if(api.downloadDict[hash].length == 0){
                        delete api.downloadDict[hash];
                        combineTmp(hash);
                        break;
                    }
                }
            }
        }
        sendDownload()
    },
    getMissions: function(){
        if(isEmptyObject(api.Mission)){
            api.Mission = api.getAllMission().mission;
        }
        return api.Mission
    },
    writeMissions: function(mission){
        api.AllMission['mission'] = mission;
        api.Mission = mission;
        fs.writeFileSync(Constants.MISSION_PATH,JSON.stringify(api.AllMission,null,2));
    },
    pushMission: function(data){
        api.getAllMission();
        let jsonObj = data.content;
        console.info('missions',jsonObj)
        api.writeMissions(jsonObj);
        api.compileMissions()
    },

    playMission: function(){
        console.log('play')
    },
    stopMission: function(){
        console.log('stop')
    }
};

module.exports = api;
