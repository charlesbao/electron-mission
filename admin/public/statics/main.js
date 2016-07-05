var socket = io();
var dict = {};
var id = 'root';

const Constants = {
    IM:'admin',
    ID:id,

    SOCKET:{
        ON:{
            _DISCONNECT:'disconnect',
            _CONNECT:'connect',

            SHOW_FIELD:'SHOW_FIELD'
        },
        EMIT:{
            WHO:'WHO',
            CLEAR_MISSION:'CLEAR_MISSION'
        }
    }
};

$(function(){
    initHtml(function(){
        showFileUploadField()
    })
});

function initHtml(callback){
    addTemplateToStorage();
    callback()

    socket.on(Constants.SOCKET.ON._CONNECT, function(){
        console.info('welcome to the server!');
        socket.emit(Constants.SOCKET.EMIT.WHO, { IM:Constants.IM,ID:Constants.ID });
    });
    socket.on(Constants.SOCKET.ON._DISCONNECT, function(){
        console.log(Constants.SOCKET.ON._DISCONNECT)
    });
    socket.on(Constants.SOCKET.ON.SHOW_FIELD,function(data){
        var html;
        for(var key in data){
            switch (key){
                case '#mission':
                    var arr = []
                    data[key].forEach(function(each){
                        arr.push(each.trueName)
                    });
                    html = arr.join(',');
                    break;
                default:
                    html = data[key];
                    break;
            }
            $(key).html(html)
        }

    })
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


}

function startClear(socket){
    socket.emit(Constants.SOCKET.EMIT.CLEAR_MISSION)
}