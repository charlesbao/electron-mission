let tar = require("tar");
let fs = require('fs');
let Path = require('path');

let child = {
    extractTar:function (thePath,trueName){

        let tarName = trueName + '.tar';

        let extractor = tar.Extract({path: thePath})
            .on('error', onError)
            .on('end', onEnd);

        fs.createReadStream(Path.join(thePath,tarName))
            .on('error', onError)
            .pipe(extractor);

        function onError(err) {
            console.error('An error occurred:', err)
        }
        function onEnd() {
            fs.unlinkSync(Path.join(thePath,tarName))
            console.log('Extracted!')
        }
    }
};

;(function(){
    let options = process.argv;
    switch (options[2]){
        case 'extractTar':
            let thePath = options[3];
            let trueName = options[4];
            child.extractTar(thePath,trueName)
            break;
        default:
            break;

    }
})(process.argv);

