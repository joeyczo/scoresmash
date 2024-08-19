/*
 * Copyright (c) 2024. SCORE SMASH
 * ScoreSmash - Développé par Joey CAZO
 * License : Apache-2.0, Août 2024
 */

/********* DÉPENDANCES *********/


/********* INTERFACES *********/

interface dataRemote {
    roomId  : string,
    player  : number
}


/********* METHODES *********/

// @ts-ignore
var dev : boolean = false; // TODO : Changer

var joinSession = () => {

    sessionStorage.clear();

    let codeAcces : string = $("#access").val() as string;
    let player    : number = Number($("#player").val());

    if (codeAcces.length === 0) return;

    // @ts-ignore
    let socket = io();

    let dataRoom : dataRemote = {
        roomId : codeAcces,
        player : player
    }

    sessionStorage.setItem('roomData', JSON.stringify(dataRoom));

    window.location.href = '/rmbad';

}

var addPointPlayer = () => {

    remoteBad.newPoint();

}

let remoteBad : BadRemote;
let timeoutBtn : any;

var initRemoteBad = () => {

    remoteBad = new BadRemote();

}


class BadRemote {

    private socket : any;
    private dataRoom : dataRemote;

    constructor() {

        // @ts-ignore
        this.socket = io();
        this.dataRoom = JSON.parse(sessionStorage.getItem('roomData') as string);

        this.socket.emit('joinRoom', {roomId : this.dataRoom.roomId});

        this.initSocket();
        this.connectRemote();

    }

    public newPoint() : void {

        this.socket.emit('newPoint', {roomId : this.dataRoom.roomId}, this.dataRoom.player);

    }

    private connectRemote() {

        this.socket.emit('getPlayerName', {roomId : this.dataRoom.roomId});

    }

    private initSocket() {

        this.socket.on('fetchPlayersName', (players : any) : void => {

            let player = players[this.dataRoom.player === 1 ? "player1" : "player2"];

            $("#player_name").html(player);

        })

    }

}

$(() => {

    $(".point-btn").on('touchstart', () => {
        timeoutBtn = setTimeout(() => {addPointPlayer()}, 2000);
    })

    $(".point-btn").on('touchend', () => {
        clearTimeout(timeoutBtn);
    })

    $(".point-btn").on('touchcancel', () => {
        clearTimeout(timeoutBtn);
    })

})