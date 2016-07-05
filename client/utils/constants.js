const Path = require('path');

const rootPath = Path.join(__dirname,'..');
const assetsPath = Path.join(rootPath,'assets');


const url = 'http://127.0.0.1:8320';

const Constants = {
    URL:url,
    DOWNLOAD_URL:url+ '/tmp/',
    
    ASSETS_PATH:assetsPath,
    TMP_FOLDER:Path.join(assetsPath,'tmp'),
    FILES_FOLDER:Path.join(assetsPath,'files'),
    SHOW_FOLDER:Path.join(assetsPath,'show'),
    MISSION_PATH:Path.join(rootPath,'mission.json'),

    DB:Path.join(rootPath,'db'),
    STATUS_CODE:{
        NOT_FOUND:404
    },
    SOCKET:{
        IM:'client',

        ON:{
            _CONNECT:'connect',
            _DISCONNECT:'disconnect',
            _ERROR:'error',
            _RECONNECT:'reconnect',

            WELCOME:'WELCOME',
            EMIGRATE:'EMIGRATE',
            PUSH_MISSION:'PUSH_MISSION',


        },
        EMIT:{
            WHO:'WHO',
            CLIENT_RECV:'CLIENT_RECV',
        }
    }
};

module.exports = Constants