var fs = require('fs');
var Path = require('path');
var Constants = require('./constants');
var Utils = require('./index');
var low = require('lowdb');
var moment = require('moment');

var MISSION = null;
var CLIENT = null;

var store = {

    initMission: function(){

        var DB = low(Constants.DB);
        MISSION = DB.get('MISSION');
        CLIENT = DB.get('CLIENT');

        Utils.checkFolder();
        fs.readdir(Constants.TMP_FOLDER,function(err,files){

            for(var i = 0;i < files.length; i++){
                var exist = false;
                if(files[i] == '.DS_Store'){
                    fs.unlinkSync(Path.join(Constants.TMP_FOLDER,'.DS_Store'));
                    continue;
                }
                MISSION.map('hash').value().forEach(function(each){
                    if(files[i] == each){
                        exist = true;
                    }
                });
                if(!exist){
                    Utils.deleteFolderRecursive(Path.join(Constants.TMP_FOLDER,files[i]))
                }
            }
        })
    },



    pushMission: function(theMission){
        MISSION.push(theMission).value();
        MISSION = low(Constants.DB).get('MISSION');
    },
    getMission:function(){
        return MISSION.value()
    },
    removeMission: function(hash){
        MISSION.remove({ HASH: hash }).value();
        MISSION = low(Constants.DB).get('MISSION');
    },


    setClientState: function(theClient,state){
        switch (state){
            case Constants.CLIENT.ONLINE:
                if(CLIENT.find({name:theClient}).value() != undefined){
                    CLIENT.find({name:theClient}).assign({
                        state: Constants.CLIENT.ONLINE,
                        onlineDate:moment().format('YYYY-MM-DD HH:mm:ss')
                    }).value();
                }else{
                    CLIENT.push({
                        name: theClient,
                        state: Constants.CLIENT.ONLINE,
                        onlineDate:moment().format('YYYY-MM-DD HH:mm:ss')
                    }).value();
                }
                break;
            case Constants.CLIENT.OFFLINE:
                CLIENT.find({name:theClient}).assign({
                    state: Constants.CLIENT.OFFLINE,
                    offlineDate:moment().format('YYYY-MM-DD HH:mm:ss')
                }).value();
                break;
            default:
                break;
        }
    },
    getClient: function(state){
        switch (state){
            case Constants.CLIENT.ONLINE:
                return CLIENT.filter({state: Constants.CLIENT.ONLINE}).map('name').value();
            case Constants.CLIENT.OFFLINE:
                return CLIENT.filter({state: Constants.CLIENT.OFFLINE}).map('name').value();
            default:
                return CLIENT.map('name').value()
        }
    },
    removeClient: function(name){
        CLIENT.remove({ name: name }).value();
        CLIENT = low(Constants.DB).get('CLIENT');
    },


    clearMission: function(){
        low(Constants.DB).set('MISSION',Constants.ARRAY_NULL).value();
        MISSION = low(Constants.DB).get('MISSION');
        Utils.deleteFolderRecursive(Constants.TMP_FOLDER)
        return MISSION
    },
    clearClient: function(){
        low(Constants.DB).set('CLIENT',Constants.ARRAY_NULL).value();
        CLIENT = low(Constants.DB).get('CLIENT');
    }
};

module.exports = store;