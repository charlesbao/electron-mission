var fs = require('fs');
var Path = require('path')
var Constants = require('./constants')
var Utils = require('./index')

var AllMission = null;
var Client = null;
var Mission = null;

function getAllMission(){
    if(Utils.isEmptyObject(AllMission)){
        AllMission = JSON.parse(fs.readFileSync(Constants.MISSION_PATH))
    }
    return AllMission
}

var store = {

    initMission: function(){
        var Mission = store.getMission();

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
        var AllMission = getAllMission();
        AllMission['mission'][key] = theMission;
        fs.writeFileSync(Constants.MISSION_PATH,JSON.stringify(AllMission,null,2));
        Mission = AllMission['mission']
    },
    getMission:function(){
        if(Utils.isEmptyObject(Mission)){
            Mission = getAllMission().mission;
        }
        return Mission
    },
    setClientState: function(theClient,state){
        if(Utils.isEmptyObject(Client)){
            var arr = getAllMission().client;

            var dict = {};
            for(var i in arr){
                dict[arr[i]] = Constants.CLIENT.OFFLINE
            }
            Client = dict;
        }
        switch (state){
            case Constants.CLIENT.ONLINE:
            case Constants.CLIENT.OFFLINE:
                Client[theClient] = state;
                break;
            default:
                break;
        }
    },
    getClient: function(state){

        if(Utils.isEmptyObject(Client)){
            var arr = getAllMission().client;

            var dict = {};
            for(var i in arr){
                dict[arr[i]] = Constants.CLIENT.OFFLINE
            }
            Client = dict;
        }

        var TypeClient = [];
        switch (state){
            case Constants.CLIENT.ONLINE:
                for(var key in Client){
                    if(Client[key] == Constants.CLIENT.ONLINE){
                        TypeClient.push(key)
                    }
                }
                break;
            case Constants.CLIENT.OFFLINE:
                for(var key in Client){
                    if(Client[key] == Constants.CLIENT.OFFLINE){
                        TypeClient.push(key)
                    }
                }
                break;
            default:
                for(var key in Client){
                    TypeClient.push(key)
                }
                break;
        }
        return TypeClient
    },
    clearMission: function(){
        var AllMission = getAllMission();
        AllMission['mission'] = {};
        fs.writeFileSync(Constants.MISSION_PATH,JSON.stringify(AllMission,null,2));
        Mission = AllMission['mission']
        Utils.deleteFolderRecursive(Constants.TMP_FOLDER)
    }
};

module.exports = store;