var fs = require('fs');
var Path = require('path')
var Constants = require('./constants')
var Utils = require('./index')

var AllMission = {};
var Client = {};
var Mission = {};

function getAllMission(){
    if(Utils.isEmptyObject(AllMission)){
        AllMission = JSON.parse(fs.readFileSync(Constants.MISSION_PATH))
    }
    return AllMission
}

var store = {

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
            Client = getAllMission().client;
            var dict = {};
            for(var i in Client){
                dict[Client[i]] = Constants.CLIENT.OFFLINE
            }
            Client = dict;
        }
        var TypeClient = [];
        switch (state){
            case 'online':
                for(var key in Client){
                    if(Client[key] == Constants.CLIENT.ONLINE){
                        TypeClient.push(key)
                    }
                }
                break;
            case 'offline':
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
    }
};

module.exports = store;