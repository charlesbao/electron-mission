var socket = io();
var chunkSize;
var hash = '';
var theFile;
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
        console.log('ok')
        getHash(this.files[0]);
    }, false);

    function getHash(file){
        chunkSize = 2097152;                    // Read in chunks of 2MB = 2097152 10485760
        var fileUpload = $('#fileUpload');
        var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
            chunks = Math.ceil(file.size / chunkSize),
            currentChunk = 0,
            spark = new SparkMD5.ArrayBuffer(),
            fileReader = new FileReader();
        fileUpload.find('.mask').addClass('active')

        fileReader.onload = function (e) {
            fileUpload.find('.mask')[0].innerText = '【正在创建HASH】\n'+Math.ceil((currentChunk + 1)/chunks * 100).toString()+'%';
            spark.append(e.target.result);                   // Append array buffer
            currentChunk++;

            if (currentChunk < chunks) {
                loadNext();
            } else {
                console.log('finished loading');
                console.info('computed hash', hash=spark.end());  // Compute hash
                theFile = file;
                fileUpload.find('.mask')[0].innerText = '【'+file.name+'】\n正在上传';
                addFile(file)
            }
        };

        fileReader.onerror = function () {
            console.warn('oops, something went wrong.');
        };

        function loadNext() {
            var start = currentChunk * chunkSize,
                end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        }

        loadNext();
    }

    function addFile(file){
        console.log(file)
        var fileUpload = $('#fileUpload');
        socket.emit('startPush',{hash:hash,fileName:file.name});
        socket.on('continueDownload',function(data){
            var length = Math.ceil(file.size/chunkSize);
            fileUpload.find('.progress')[0].style.width = (data.length / length * 300).toString() + 'px';
            if(length == data.length){
                console.log('upload complete');
                $('#fileUpload').find('.mask')[0].innerText = '【'+file.name+'】\n上传完成';
                socket.emit('endPush',{
                    code:200,
                    hash:hash,
                    trueName:file.name,
                    chunkSize:chunkSize,
                    size:file.size,
                    type:file.type
                });
            }else{
                var size = Math.min(file.size-data.length*chunkSize,chunkSize);
                isEnd = size<chunkSize ? file.name:false;
                console.log(file.name+'.'+data.length.toString())
                setTimeout(function(){
                    socket.emit('pushItems',{
                        code:200,
                        content:file.slice(data.length*chunkSize,data.length*chunkSize+chunkSize),
                        name:file.name+'.'+data.length.toString(),
                        size:file.size,
                        chunkSize:chunkSize,
                        hash:hash,
                        trueName:isEnd,
                        type:file.type
                    });
                },500)

            }
        });
    }
}