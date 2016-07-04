var fs = require('fs');
var Path = require('path')
var Constants = require('./constants')
var Utils = require('./index')
var low = require('lowdb')
var moment = require('moment')

var MISSION = low(Constants.DB).get('MISSION');
var CLIENT = low(Constants.DB).get('CLIENT');

var store = {

    initMission: function(){

        var Mission = MISSION.value();
        Utils.checkFolder();
        fs.readdir(Constants.TMP_FOLDER,function(err,files){

            for(var i = 0;i < files.length; i++){
                var exist = false;
                if(files[i] == '.DS_Store')continue
                for(var trueName in Mission){
                    if(files[i] == Mission[trueName]['hash']){
                        exist = true;
                    }
                }
                if(!exist){
                    Utils.deleteFolderRecursive(Path.join(Constants.TMP_FOLDER,files[i]))
                }
            }
        })
    },
    setMission: function(key,theMission){
        MISSION.push(theMission);
        return MISSION.getMission()
    },
    getMission:function(){
        MISSION = low(Constants.DB).get('MISSION');
        return Mission.value()
    },
    setClientState: function(theClient,state){
        switch (state){
            case Constants.CLIENT.ONLINE:
                CLIENT.find(theClient).assign({
                    STATE: Constants.CLIENT.ONLINE,
                    ONLINE_DATE:moment().format('YYYY-MM-DD HH:mm')
                });
                break;
            case Constants.CLIENT.OFFLINE:
                CLIENT.find(theClient).assign({
                    STATE: Constants.CLIENT.OFFLINE,
                    OFFLINE_DATE:moment().format('YYYY-MM-DD HH:mm')
                });
                break;
            default:
                break;
        }
    },
    getClient: function(state){
        switch (state){
            case Constants.CLIENT.ONLINE:
                return CLIENT.filter({STATE: Constants.CLIENT.ONLINE}).map('NAME').value();
            case Constants.CLIENT.OFFLINE:
                return CLIENT.filter({STATE: Constants.CLIENT.OFFLINE}).map('NAME').value();
            default:
                return CLIENT.map('NAME').value()
        }
    },
    clearMission: function(){
        var AllMission = getAllMission();
        AllMission['mission'] = {};
        low(Constants.MISSION_PATH).set("mission",{});
        // fs.writeFileSync(Constants.MISSION_PATH,JSON.stringify(AllMission,null,2));
        Mission = AllMission['mission']
        Utils.deleteFolderRecursive(Constants.TMP_FOLDER)
    }
};

module.exports = store;