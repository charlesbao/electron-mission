var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require("body-parser");
var routes = require('./routes');
var port = 8320;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'html');
app.set('views',__dirname + '/public/views');
app.engine('.html', require('ejs').__express);

app.get('/',routes.index);
app.get('/tmp/:hash/:name', routes.fileSend);
io.on('connection', routes.sockets);

http.listen(port, function(){
  console.log('listening on *:8320');
});
