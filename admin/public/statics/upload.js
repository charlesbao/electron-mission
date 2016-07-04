
var UploadEvent = {
    SocketConstants:{
        START_PUSH:'START_PUSH',
        CONTINUE_PUSH:'CONTINUE_PUSH',
        PUSH_ITEMS:'PUSH_ITEMS',
        END_PUSH:'END_PUSH'
    },
    chunkSize:null,
    hash:null,

    init: function (socket,file,maxThread){
        if(file.size < UploadEvent.conventToByte(10)){
            UploadEvent.chunkSize = UploadEvent.conventToByte(2);
        }else{
            UploadEvent.chunkSize = UploadEvent.conventToByte(5);
        }
        // var fileUpload = $('#fileUpload');
        var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
            chunks = Math.ceil(file.size / UploadEvent.chunkSize),
            currentChunk = 0,
            spark = new SparkMD5.ArrayBuffer(),
            fileReader = new FileReader();

        // fileUpload.find('.mask').addClass('active')

        fileReader.onload = function (e) {

            // fileUpload.find('.mask')[0].innerText = '【正在创建HASH】\n'+Math.ceil((currentChunk + 1)/chunks * 100).toString()+'%';

            spark.append(e.target.result);                   // Append array buffer
            currentChunk++;

            if (currentChunk < chunks) {
                loadNext();
            } else {
                console.log('finished loading');
                console.info('computed hash', UploadEvent.hash=spark.end());  // Compute hash
                // fileUpload.find('.mask')[0].innerText = '【'+file.name+'】\n正在上传';
                UploadEvent.addFile(socket,file,maxThread)
            }
        };

        fileReader.onerror = function () {
            console.warn('oops, something went wrong.');
        };

        function loadNext() {
            var start = currentChunk * UploadEvent.chunkSize,
                end = ((start + UploadEvent.chunkSize) >= file.size) ? file.size : start + UploadEvent.chunkSize;

            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        }

        loadNext();
    },
    pushItems: function (socket,file,queue,maxThread){
        for(var i in queue){
            var dict = {
                content: file.slice(queue[i]*UploadEvent.chunkSize,queue[i]*UploadEvent.chunkSize+UploadEvent.chunkSize),
                name: `${file.name}.${queue[i]}`,
                hash: UploadEvent.hash
            };
            if(maxThread == i || i == queue.length - 1) {
                dict['stop'] = 1;
                socket.emit(UploadEvent.SocketConstants.PUSH_ITEMS,dict);
                break;
            }else{
                socket.emit(UploadEvent.SocketConstants.PUSH_ITEMS,dict);
            }
        }
    },
    addFile: function (socket,file,maxThread){

        var queue = [];
        var length = Math.ceil(file.size/UploadEvent.chunkSize);

        for(var i = 0;i < length; i ++){
            queue.push(i)
        }

        socket.emit(UploadEvent.SocketConstants.START_PUSH,{
            hash:UploadEvent.hash,
            chunkSize:UploadEvent.chunkSize,
            trueName:file.name
        });

        socket.on(UploadEvent.SocketConstants.CONTINUE_PUSH,function(data){

            var filesQueue = data.files;

            for(var x in queue){
                for(var y in filesQueue){
                    if(`${file.name}.${queue[x]}` == filesQueue[y]){
                        queue.splice(x,1)
                    }
                }
            }
            // $('#fileUpload').find('.progress')[0].style.width = ((length - queue.length) / length * 300).toString() + 'px';
            if(queue.length){
                UploadEvent.pushItems(socket,file,queue,maxThread)
            }else{
                socket.off(UploadEvent.SocketConstants.CONTINUE_PUSH)
                socket.emit(UploadEvent.SocketConstants.END_PUSH,{
                    hash:UploadEvent.hash,
                    chunkSize:UploadEvent.chunkSize,
                    number:length,
                    trueName:file.name,
                    size:file.size,
                    type:file.type
                });

                // $('#fileUpload').find('.mask')[0].innerText = '【'+file.name+'】\n上传完成';
                setTimeout(function(){
                    document.getElementById("file").value = '';
                },500)
            }
        });
    },
    conventToByte:function (MB){
        return MB * 1024 * 1024
    }
};

function startUpload(socket,file,maxThread){
    UploadEvent.init(socket,file,maxThread)
}