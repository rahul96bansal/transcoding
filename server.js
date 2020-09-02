
// var child = require('child_process');
// var io = require('socket.io');
// var events = require('events');
// var express = require('express')
// var app = express();
// var server = require('http').Server(app);
// var io = require('socket.io')(server);
// var spawn = child.spawn;
// var exec = child.exec;
// var Emitters = {}
// var config = {
//     port:8001,
//     url:'rtsp://131.95.3.162/axis-media/media.3gp'
// }
// var initEmitter = function(feed){
//     if(!Emitters[feed]){
//         Emitters[feed] = new events.EventEmitter().setMaxListeners(0)
//     }
//     return Emitters[feed]
// }
// //web app
// console.log('Starting Express Web Server on Port '+config.port)

// server.listen(config.port);

// app.get('/', function (req, res) {
//     res.sendFile(__dirname + '/index.html');
// })

// //ffmpeg pushed stream in here to make a pipe
// app.all('/streamIn/:feed', function (req, res) {
//     req.Emitter = initEmitter(req.params.feed)
//     //req.params.feed = Feed Number (Pipe Number)
// 	res.connection.setTimeout(0);
// 	req.on('data', function(buffer){
// 		req.Emitter.emit('data',buffer)
//         io.to('STREAM_'+req.params.feed).emit('h264',{feed:req.params.feed,buffer:buffer})
// 	});
// 	req.on('end',function(){
// 		console.log('close');
// 	});
// })

// //socket.io client commands
// io.on('connection', function (cn) {
//     cn.on('f',function (data) {
//         switch(data.function){
//             case'getStream':
//                 console.log(data)
//                 cn.join('STREAM_'+data.feed)
//             break;
//         }
//     })
// });

// //simulate RTSP over HTTP
// app.get(['/h264','/h264/:feed'], function (req, res) {
//     if(!req.params.feed){req.params.feed='1'}
//     req.Emitter = initEmitter(req.params.feed)
//     var contentWriter
//     var date = new Date();
//     res.writeHead(200, {
//         'Date': date.toUTCString(),
//         'Connection': 'keep-alive',
//         'Cache-Control': 'no-cache',
//         'Pragma': 'no-cache',
//         'Content-Type': 'video/mp4',
//         'Server': 'Shinobi H.264 Test Stream',
//     });
//     req.Emitter.on('data',contentWriter=function(buffer){
//         res.write(buffer)
//     })
//     res.on('close', function () {
//         req.Emitter.removeListener('data',contentWriter)
//     })
// });

// //ffmpeg
// console.log('Starting FFMPEG')
// var ffmpegString = '-i '+config.url+''
// ffmpegString += ' -f mpegts -c:v mpeg1video -an http://localhost:'+config.port+'/streamIn/1'
// ffmpegString += ' -f mpegts -c:v mpeg1video -an http://localhost:'+config.port+'/streamIn/2'
// if(ffmpegString.indexOf('rtsp://')>-1){
//     ffmpegString='-rtsp_transport tcp '+ffmpegString
// }
// console.log('Executing : ffmpeg '+ffmpegString)
// var ffmpeg = spawn('ffmpeg',ffmpegString.split(' '));
// ffmpeg.on('close', function (buffer) {
//     console.log('ffmpeg died')
// })


//ffmpeg.stderr.on('data', function (buffer) {
//    console.log(buffer.toString())
//});
//ffmpeg.stdout.on('data', function (buffer) {
//    Emitter.emit('data',buffer)
//});




const express = require("express");

const ffmpeg = require("fluent-ffmpeg");

const bodyParser = require("body-parser");

const fs = require("fs");

const fileUpload = require("express-fileupload");

const app = express();

// // parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }));

// // parse application/json
// app.use(bodyParser.json());

// //support parsing of application/x-www-form-urlencoded post data

// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//   })
// );

ffmpeg.setFfmpegPath("C:/ffmpeg/bin/ffmpeg.exe");

ffmpeg.setFfprobePath("C:/ffmpeg/bin");

ffmpeg.setFlvtoolPath("C:/flvtool");

console.log(ffmpeg);

app.get("/", (req, res) => {
  res.send("hello world");
});

app.post("/convert", (req, res) => {
  //res.contentType(`video/${to}`);
  //res.attachment(`output.${to}`

  let to = req.body.to;
  let file = req.files.file;
  let size = req.body.size;
  let fileName = `output.${to}`;
  console.log(to);
  console.log(file);
  console.log(size);

  file.mv("tmp/" + file.name, function (err) {
    if (err) return res.sendStatus(500).send(err);
    console.log("File Uploaded successfully");
  });

  ffmpeg("tmp/" + file.name)
    .withOutputFormat(to)
    // .output(basename + '-1280x720.mp4')
    // .videoCodec('libx264')  
    // .noAudio()
    .size(size)     
    // .videoBitrate('1k')
    .outputOptions(['-c:v libx264', '-crf 18' , '-preset veryfast'])
    .setStartTime('0')
    .setDuration('10')
    .on("end", function (stdout, stderr) {
      console.log("Finished");
      res.download(__dirname + fileName, function (err) {
        if (err) throw err;

        fs.unlink(__dirname + fileName, function (err) {
          if (err) throw err;
          console.log("File deleted that was downloaded");
        });
      });
      fs.unlink("tmp/" + file.name, function (err) {
        if (err) throw err;
        console.log("File deleted that was converted");
      });
    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + file.name, function (err) {
        if (err) throw err;
        console.log("File deleted that has to be converted due to error");
      });
    })
    .saveToFile(__dirname + fileName);
  //.pipe(res, { end: true });
});

const http = require("http");
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};

// const onlineUsers = {};

// io.on("connection", function (socket) {
//   console.log("A new client connected");

//   // To subscribe the socket to a given channel
//   socket.on("join", function (data) {
//     socket.join(data.username);
//   });

//   // To keep track of online users
//   socket.on("userPresence", function (data) {
//     onlineUsers[socket.id] = {
//       username: data.username,
//     };
//     socket.broadcast.emit("onlineUsers", onlineUsers);
//   });

//   // For message passing
//   socket.on("message", function (data) {
//     io.sockets.to(data.toUsername).emit("message", data.data);
//   });

//   // To listen for a client's disconnection from server and intimate other clients about the same
//   socket.on("disconnect", function (data) {
//     socket.broadcast.emit("disconnected", onlineUsers[socket.id].username);

//     delete onlineUsers[socket.id];
//     socket.broadcast.emit("onlineUsers", onlineUsers);
//   });
// });

io.on("connection", (socket) => {
  if (!users[socket.id]) {
    users[socket.id] = socket.id;
  }
  
  socket.emit("yourID", socket.id);
  io.sockets.emit("allUsers", users);

  socket.on("disconnect", () => {
    delete users[socket.id];
  });

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("hey", {
      signal: data.signalData,
      from: data.from,
    });
  });

  socket.on("acceptCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

server.listen(8000, () => console.log("server is running on port 8000"));


// app.listen(8000);

