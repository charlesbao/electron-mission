var socket = io();
var dict = {};

$(function(){
    initHtml(function(){
        showFileUploadField()
    })
});

function initHtml(callback){
    socket.on('connect', function(){
        console.info('welcome to the server!')
        socket.emit('who', { IM:'admin',ID:'root' });
    });
    socket.on('disconnect', function(){
        console.log('dis')
    });
    addTemplateToStorage();
    callback()
}

function addTemplateToStorage(){
    var templateSelector = $("script[type='text/template']")
    templateSelector.each(function(i,each){
        dict[each.id] = each.innerHTML
    });
    templateSelector.remove();
}

function showWelcomeField(){
    $('#main').html(dict['welcome-template']).fadeIn();
}

function showFileUploadField(){
    $('#fileUpload-field').html(dict['upload-template']).fadeIn();

    document.getElementById('file').addEventListener("change", function(){
        console.log('upload');
        startUpload(socket,this.files[0],2)
    }, false);
    document.getElementById('clearMission').addEventListener("click", function(){
        console.log('clearMission');
        startClear(socket)
    }, false);

    socket.on('showField',function(data){
        console.log(data)
        for(var key in data){
            $(key).html(data[key])
        }
    })
    socket.emit('showField');

}

function startClear(socket){
    socket.emit('clearMission')
}