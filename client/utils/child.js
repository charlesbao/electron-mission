let tar = require("tar");
let fs = require('fs');
let Path = require('path');
let Constants = require('./constants')

let child = {
    extractTar:function (trueName,callback){

        // let tarName = trueName + '.tar';

        let extractor = tar.Extract({path: Constants.SHOW_FOLDER})
            .on('error', onError)
            .on('end', onEnd);

        fs.createReadStream(Path.join(Constants.FILES_FOLDER,trueName))
            .on('error', onError)
            .pipe(extractor);

        function onError(err) {
            console.error('An error occurred:', err)
        }
        function onEnd() {
            // fs.unlinkSync(Path.join(thePath,trueName))
            console.log('Extracted!')
            let rep = trueName.split('.');rep.pop()
            callback(Path.join(Constants.SHOW_FOLDER,rep.join('.')))
        }
    }
};

module.exports = child;

// ;(function(){
//     let options = process.argv;
//     switch (options[2]){
//         case 'extractTar':
//             let thePath = options[3];
//             let trueName = options[4];
//             child.extractTar(thePath,trueName)
//             break;
//         default:
//             break;
//
//     }
// })(process.argv);

