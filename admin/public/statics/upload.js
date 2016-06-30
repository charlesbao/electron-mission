var uploadEvent = {
    chunkSize:null,
    hash:null,

    init: function (socket,file,maxThread){
        if(file.size < uploadEvent.conventToByte(10)){
            uploadEvent.chunkSize = uploadEvent.conventToByte(2);
        }else{
            uploadEvent.chunkSize = uploadEvent.conventToByte(1);
        }
        var fileUpload = $('#fileUpload');
        var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
            chunks = Math.ceil(file.size / uploadEvent.chunkSize),
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
                console.info('computed hash', uploadEvent.hash=spark.end());  // Compute hash
                fileUpload.find('.mask')[0].innerText = '【'+file.name+'】\n正在上传';
                uploadEvent.addFile(socket,file,maxThread)
            }
        };

        fileReader.onerror = function () {
            console.warn('oops, something went wrong.');
        };

        function loadNext() {
            var start = currentChunk * uploadEvent.chunkSize,
                end = ((start + uploadEvent.chunkSize) >= file.size) ? file.size : start + uploadEvent.chunkSize;

            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        }

        loadNext();
    },
    pushItems: function (socket,file,queue,maxThread){
        for(var i in queue){
            var dict = {
                content: file.slice(queue[i]*uploadEvent.chunkSize,queue[i]*uploadEvent.chunkSize+uploadEvent.chunkSize),
                name: `${file.name}.${queue[i]}`,
                hash: uploadEvent.hash
            };
            if(maxThread == i || i == queue.length - 1) {
                dict['stop'] = 1;
                socket.emit('pushItems',dict);
                break;
            }else{
                socket.emit('pushItems',dict);
            }
        }
    },
    addFile: function (socket,file,maxThread){

        var queue = [];
        var length = Math.ceil(file.size/uploadEvent.chunkSize);

        for(var i = 0;i < length; i ++){
            queue.push(i)
        }

        socket.emit('startPush',{
            hash:uploadEvent.hash,
            chunkSize:uploadEvent.chunkSize,
            trueName:file.name
        });

        socket.on('continue',function(data){

            var filesQueue = data.files;

            for(var x in queue){
                for(var y in filesQueue){
                    if(`${file.name}.${queue[x]}` == filesQueue[y]){
                        queue.splice(x,1)
                    }
                }
            }
            $('#fileUpload').find('.progress')[0].style.width = ((length - queue.length) / length * 300).toString() + 'px';
            if(queue.length){
                uploadEvent.pushItems(socket,file,queue,maxThread)
            }else{
                socket.off('continue')
                console.log(uploadEvent.chunkSize)
                socket.emit('endPush',{
                    hash:uploadEvent.hash,
                    chunkSize:uploadEvent.chunkSize,
                    number:length,
                    trueName:file.name,
                    size:file.size,
                    type:file.type
                });

                $('#fileUpload').find('.mask')[0].innerText = '【'+file.name+'】\n上传完成';
                setTimeout(function(){location.reload()},500)
            }
        });
    },
    conventToByte:function (MB){
        return MB * 1024 * 1024
    }
};

function startUpload(socket,file,maxThread){
    uploadEvent.init(socket,file,maxThread)
}