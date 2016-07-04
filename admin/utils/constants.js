const Path = require('path');

const rootPath = Path.join(__dirname,'..');
const assetsPath = Path.join(rootPath,'assets');

const Constants = {
    URL:'http://127.0.0.1:8320',
    DOWNLOAD_URL:'http://127.0.0.1:8320/tmp/',

    ARRAY_NULL:[],

    ASSETS_PATH:assetsPath,
    TMP_FOLDER:Path.join(assetsPath,'tmp'),
    FILES_FOLDER:Path.join(assetsPath,'files'),
    MISSION_PATH:Path.join(rootPath,'mission.json'),

    DB:Path.join(rootPath,'db'),

    WHO:{
        CLIENT:'client',
        ADMIN:'admin'
    },
    CLIENT:{
        ONLINE:1,
        OFFLINE:0
    },
    SOCKET:{
        ON:{
            _DISCONNECT:'disconnect',

            WHO:'WHO',
            START_PUSH:'START_PUSH',
            END_PUSH:'END_PUSH',
            PUSH_ITEMS:'PUSH_ITEMS',
            CLIENT_RECV:'CLIENT_RECV',
            CLEAR_MISSION:'CLEAR_MISSION'
        },
        EMIT:{
            WELCOME:'WELCOME',
            PUSH_MISSION:'PUSH_MISSION',
            SHOW_FIELD:'SHOW_FIELD',
            CONTINUE_PUSH:'CONTINUE_PUSH',

        }
    }
};

module.exports = Constants