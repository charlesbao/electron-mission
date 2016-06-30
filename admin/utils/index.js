var fs = require('fs');
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
    return JSON.stringify(obj) == '{}';
}


exports.deleteFolderRecursive = function (path) {
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