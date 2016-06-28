const {ipcRenderer} = require('electron');
const fs = require('fs');
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

function deleteFolderRecursive2(thePath) {
  if(fs.existsSync(thePath)) {
    var files = fs.readdirSync(thePath);
    for(var i = 0; i < files.length; i++){
      try{fs.unlinkSync(Path.join(thePath,files[i]))}
      catch (err){
        console.log('warn:'+err);
      }
      if(i == files.length - 1){
        try{fs.rmdirSync(thePath);}
        catch (err){
          console.log('warn:'+err);
        }
      }
    }
  }
}

function compile(){
  console.log('start mapping all mission');
  var AllMission = api.getMissions();
  //开始遍历节目
  for(var each = 0;each < AllMission.length;each ++){
    var data = AllMission[each];
    //如果节目状态显示未完成，则进行下步操作
    if(data['complete'] != true){
      //跳出循环
      return downloadAndExtract(data)
    }
  }
  console.log('complete mapping')
}

function downloadAndExtract(data){
  var thePath = Path.join(Constants.TMP_FOLDER,data['hash']);
  //如果临时文件夹不存在，则创建
  if(!fs.existsSync(thePath))fs.mkdirSync(thePath);
  //遍历检查未下载分包
  var shouldDownload = [];
  for(var each = 0;each < data['download'].length; each ++){
    shouldDownload.push(data['download'][each])
  }
  var files = fs.readdirSync(thePath);
  for(var x = 0; x < shouldDownload.length; x++){
    for(var z = 0; z < files.length; z++){
      //检查分包是否存在
      if(files[z] == shouldDownload[x]){
        var theFile = Path.join(thePath,files[z]);
        //检查分包大小是否正确
        if(fs.lstatSync(theFile).size == data['chunkSize']
            || fs.lstatSync(theFile).size == data['size']%data['chunkSize'])
          shouldDownload.splice(x,1);
      }
    }
  }
  console.log(shouldDownload);
  if(shouldDownload.length == 0){
    console.info('start child_process');
    //启动子进程，进行合包，解压操作
    var exec = require("child_process").exec,
        ext = exec('node child.js '+ thePath + ' ' + data['trueName']);
    ext.stdout.on('data', function (data) {console.log(data)});
    ext.stderr.on('data', function (data) {console.log('warn:' + data)});
    ext.on('exit', function (code) {
      data['complete'] = true;
      fs.writeFileSync(Constants.MISSION_PATH,JSON.stringify(data));
      console.info('complete!');
      //deleteFolderRecursive(thePath);
      //遍历检查节目
      return compile()
    });
  }else{
    requests(shouldDownload,data)
  }
}

function requests(shouldDownload,data){
  var downloadList = shouldDownload;
  var theName = Url.resolve(Constants.DOWNLOAD_URL,data['hash'])+'/'+downloadList[0];
  console.log('start Download',downloadList[0])
  request({url:theName,timeout:5000}).on('error',function(err){
    console.log(err);
    //如果处于断线状态则立即返回
    if(connect == false){
      return
    }else{
      return requests(downloadList,data)
    }
  }).pipe(fs.createWriteStream(Path.join(Constants.TMP_FOLDER,data['hash'],downloadList[0]))).on('finish',function(){
    console.log('finish Download');
    downloadList.splice(0,1);
    if(downloadList.length == 0){
      downloadAndExtract(data)
    }else{
      return requests(downloadList,data)
    }
  })
}


let api = {
  checkFolder:function(){
    if(!fs.existsSync(Constants.ASSETS_PATH))fs.mkdirSync(Constants.ASSETS_PATH);
    if(!fs.existsSync(Constants.TMP_FOLDER))fs.mkdirSync(Constants.TMP_FOLDER);
    if(!fs.existsSync(Constants.FILES_FOLDER))fs.mkdirSync(Constants.FILES_FOLDER);
  },

  compileMission: function(){
      return compile()
  },
  getMissions: function(){
    JSON.parse(fs.readFileSync(Constants.MISSION_PATH));
  },
  clearMissions: function(){
    this.stopMission();
    fs.writeFileSync(Constants.MISSION_PATH,Constants.ARRAY_NULL);
    deleteFolderRecursive(Constants.ASSETS_PATH);
  },
  playMission: function(){
    console.log('play')
  },
  stopMission: function(){
    console.log('stop')
  }
};

module.exports = api;
