const Constants = require('./constants');
const {ipcRenderer} = require('electron');

function init(){
    document.getElementById('reload').addEventListener('click',function(){
        location.reload()
    });
    document.getElementById('exit').addEventListener('click',function(){
        ipcRenderer.send('destroy')
    })
}

exports.init = function(){
    return init();
}