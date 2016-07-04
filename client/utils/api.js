const {ipcRenderer} = require('electron');
const fs = require('fs');
const Path = require('path');
const Url = require('url');
const Child = require('./child')
const Constants = require('./constants');
const low = require('lowdb');

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

function compile(){
    console.log('start mapping');
    //开始遍历节目
    let files = fs.readdirSync(Constants.FILES_FOLDER);
    let AllMission = api.getMissions();
    for (let each in AllMission) {
        let exist = false;
        for (let i = 0; i < files.length; i++) {
            //如果节目状态显示未完成，则进行下步操作
            if (AllMission[each]['trueName'] == files[i]) {
                exist = true;
                break;
            }
        }
        if(!exist)pushDownloadList(AllMission[each])
    }
    console.log('complete mapping');
    sendDownload()
}

function pushDownloadList(data){
    let thePath = Path.join(Constants.TMP_FOLDER,data['hash']);
    let downloadLength = data['number'];
    let trueName = data['trueName'];
    let combine = true;

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
        if(!exist){
            UNFINISHED.push({
                hash:data['hash'],
                name:downloadName
            }).value();
            combine = false;
        }
    }
    if(combine)combineTmp(data['hash'])

}

function sendDownload(){
    if(UNFINISHED.value().length == 0){
        return finishDownload()
    }else{
        let Unfinished = UNFINISHED.take(1).value()[0];
        let theUrl = Url.resolve(Constants.DOWNLOAD_URL,Unfinished['hash'])+'/'+Unfinished['name'];
        let thePath = Path.join(Constants.TMP_FOLDER,Unfinished['hash'],Unfinished['name']);
        console.info(Constants.IPC.DOWNLOAD,Unfinished['name']);

        return ipcRenderer.send(Constants.IPC.DOWNLOAD,{
            path:thePath,
            url:theUrl,
            hash:Unfinished['hash']
        });
    }
}

function finishDownload(){
    let files = fs.readdirSync(Constants.FILES_FOLDER);
    for (let i = 0; i < files.length; i++) {
        let trueName = files[i]
        if(MISSION.find({trueName:trueName}).value() == undefined){
            console.info('DELETE',trueName)
            fs.unlinkSync(Path.join(Constants.FILES_FOLDER,trueName))
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
    // if(/tar/i.test(MISSION.find({trueName:trueName})['type'])){
    //     Child.extractTar(trueName,function(Mission){
    //         api.playMission(Mission)
    //     })
    // }
}

let MISSION = low(Constants.DB).get('MISSION');
let UNFINISHED = low(Constants.DB).get('UNFINISHED');

let api = {
    checkFolder:function(){
        if(!fs.existsSync(Constants.ASSETS_PATH))fs.mkdirSync(Constants.ASSETS_PATH);
        if(!fs.existsSync(Constants.TMP_FOLDER))fs.mkdirSync(Constants.TMP_FOLDER);
        if(!fs.existsSync(Constants.FILES_FOLDER))fs.mkdirSync(Constants.FILES_FOLDER);
        if(!fs.existsSync(Constants.SHOW_FOLDER))fs.mkdirSync(Constants.SHOW_FOLDER);
    },

    compileMissions: function(){
        api.checkFolder();
        return compile()
    },
    downloadMission: function(hash,name,err){
        if(!err){
            UNFINISHED.remove({name:name}).value();
            if(UNFINISHED.find({hash:hash}).value() == undefined)
                combineTmp(hash);
        }
        sendDownload()
    },
    getMissions: function(){
        return MISSION.value()
    },
    setMission: function(missions){
        low(Constants.DB).set('MISSION',missions).value();
        MISSION = low(Constants.DB).get('MISSION');
        api.compileMissions()
    },

    playMission: function(Mission){
        var thePath = Path.join(Mission,'index.html');
        if(fs.existsSync(thePath)){
            document.getElementById('frame').src = thePath
        }
    },
    stopMission: function(){
        console.log('stop')
    }
};

module.exports = api;
