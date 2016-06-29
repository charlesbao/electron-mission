let tar = require("tar");
let fs = require('fs');
let Path = require('path');
let options = process.argv;

let child = {
    extractTar:function (trueName){

        let tarName = trueName + '.tar';

        let extractor = tar.Extract({path: './files'})
            .on('error', onError)
            .on('end', onEnd);

        fs.createReadStream('./files/'+tarName)
            .on('error', onError)
            .pipe(extractor);

        function onError(err) {
            console.error('An error occurred:', err)
        }
        function onEnd() {
            fs.unlinkSync('./files/'+trueName)
            console.log('Extracted!')
        }
    }
};


module.exports = child;
