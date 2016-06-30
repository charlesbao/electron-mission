var fs = require('fs');
var Constants = require('./constants');
// 数组工具类
exports.minus_Arr = function(arr1,arr2){
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

exports.isEmptyObject = function (obj){
    return obj == null;
}


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
};

exports.deleteFolderRecursive = function(path){
    return deleteFolderRecursive(path)
}

exports.checkFolder = function(){
    if(!fs.existsSync(Constants.ASSETS_PATH))fs.mkdirSync(Constants.ASSETS_PATH);
    if(!fs.existsSync(Constants.TMP_FOLDER))fs.mkdirSync(Constants.TMP_FOLDER);
    // if(!fs.existsSync(Constants.FILES_FOLDER))fs.mkdirSync(Constants.FILES_FOLDER);
};