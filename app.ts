/*
 * Copyright (c) 2024. SCORE SMASH
 * ScoreSmash - Développé par Joey CAZO
 * License : Apache-2.0, Août 2024
 */

// @ts-ignore
import express from 'express';
// @ts-ignore
import path, { join } from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import favicon from 'serve-favicon';
// @ts-ignore
import { Server } from 'socket.io';
// @ts-ignore
import http from "http";

const app = express();
const server = http.createServer(app);
const port = 3000;

// Convertir l'URL du fichier actuel en chemin
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
// Obtenir le nom du répertoire à partir du chemin
const __dirname = path.dirname(__filename);
const io = new Server(server);

app.use(express.static(join(__dirname, 'src')));
app.use(express.static(join(__dirname, 'socket.io')));
app.use(favicon(join(__dirname, 'src/icon/favicon.ico')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/view/start.html'));
})

app.get('/rm', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/view/rm.html'));
})

app.get('/rmbad', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/view/rmBad.html'));
})

app.get('/start', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/view/start.html'));
})

app.get('/badminton', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/view/badminton.html'));
})

io.on('connection', (socket : any) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('createRoom', (room : {roomId : string}) : void => {

        socket.join(room.roomId);
        console.log(`Room ${room.roomId} created`);

    })

    socket.on('joinRoom', (room : {roomId : string}) : void => {

        socket.join(room.roomId);
        console.log(`Room ${room.roomId} joined`);

    });

    socket.on('testSocketRoom', (room : {roomId : string}) : void => {

        io.to(room.roomId).emit('confirmRoom', {roomId : room.roomId});

    });

    socket.on('getPlayerName', (room : {roomId : string}) : void => {

        io.to(room.roomId).emit('fetchPlayerName');

    });

    socket.on('sendPlayersName', (room : {roomId : string}, players : any) => {

        console.log("Players : ", players);

        io.to(room.roomId).emit('fetchPlayersName', players);

    });

    socket.on('newPoint', (room : {roomId : string}, player : number) : void => {

        io.to(room.roomId).emit('addPoint', player);

    });

});

server.listen(port, () => {
    console.log(`En cours sur : http://localhost:${port}`);
});


/** SOCKETS **/

io.on('test', () => {
    console.log("OK");
})