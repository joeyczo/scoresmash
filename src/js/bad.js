"use strict";
/*
 * Copyright (c) 2024. SCORE SMASH
 * ScoreSmash - Développé par Joey CAZO
 * License : Apache-2.0, Août 2024
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/********* DÉPENDANCES *********/
/*import { PDFBad } from '../pdf/pdfBad.js'*/
/********* INTERFACES *********/
// @ts-ignore
var dev = false; // TODO : Changer
/********* METHODES *********/
/**
 * Début du jeu lors du click sur le bouton
 */
var clickBtn = function () {
    if (confirm('Démarrer la partie ?')) {
        var player1 = $("#player1").val();
        var player2 = $("#player2").val();
        var sets = $("#nbSets").val();
        var set = $("#nbJSets").val();
        var points = $("#nbPoints").val();
        // Objet de partie
        var obj = {
            player1: (player1.length > 0 ? player1 : "Joueur 1"),
            player2: (player2.length > 0 ? player2 : "Joueur 2"),
            sets: (sets > 0 ? sets : 2),
            set: (set > 0 ? set : 6),
            points: (points > 0 ? points : 20),
            start: new Date()
        };
        // Envoi des informations
        sessionStorage.setItem("dataGame", JSON.stringify(obj));
        // Changement de page
        window.location.href = '/badminton';
    }
};
/** JEU */
var game;
// @ts-ignore
var socket = io({
    reconnection: true, // Activer la reconnexion automatique
    reconnectionAttempts: 10, // Nombre de tentatives de reconnexion
    reconnectionDelay: 1000, // Délai entre les tentatives de reconnexion (en ms)
    reconnectionDelayMax: 5000, // Délai maximum entre les tentatives de reconnexion (en ms)
});
var startGame = function (socketR) {
    var dataGame = sessionStorage.getItem("dataGame");
    if (dataGame === null)
        window.location.href = '/';
    var obj = JSON.parse(dataGame);
    game = new Badminton(obj);
};
var randomUID = function (taille) {
    if (taille === void 0) { taille = 20; }
    var uid = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < taille; i++) {
        uid += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return uid;
};
var clickScore = function (player) {
    if (game === undefined)
        return;
    game.newPoint(player);
};
var startMatch = function () {
    game.start();
    $("button.go").hide();
};
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
/**
 * Seconde vers HH:mm:ss
 * @param {number} secondes
 * @return {string}
 */
var formatTime = function (secondes) {
    var heures = Math.floor(secondes / 3600);
    var minutes = Math.floor((secondes % 3600) / 60);
    var secs = secondes % 60;
    var formattedHours = String(heures).padStart(2, '0');
    var formattedMinutes = String(minutes).padStart(2, '0');
    var formattedSeconds = String(secs).padStart(2, '0');
    return "".concat(formattedHours, ":").concat(formattedMinutes, ":").concat(formattedSeconds);
};
/********* CLASSES *********/
/**
 * Classe du jeu de badminton permettant de gérer les actions et les joueurs
 * @class Badminton
 * @since 1.0
 * @version 1.0
 * @author Joey CAZO
 */
var Badminton = /** @class */ (function () {
    function Badminton(gameInfos) {
        this.gameInfos = gameInfos;
        this.gameInfos.sets = Number(this.gameInfos.sets);
        this.player1 = new BadmintonPlayer(gameInfos.player1, gameInfos.sets, gameInfos.points);
        this.player2 = new BadmintonPlayer(gameInfos.player2, gameInfos.sets, gameInfos.points);
        this.service = null;
        this.lastPlayerWon = null;
        this.numberPoint = 0;
        this.timeStart = 0;
        this.timeSets = 0;
        this.timePoints = 0;
        this.gameEnd = false;
        this.inGame = false;
        this.chronoSet = null;
        this.chronoPoint = null;
        this.roomId = !dev ? randomUID(5) : "dev";
        this.logsGames = [];
        this.logsSets = [];
        this.logMatch = {
            winner: 0,
            time: 0,
            numberSet: 0,
            gamesList: []
        };
        this.numSets = 0;
        socket.emit('createRoom', { roomId: this.roomId });
        socket.emit('testSocketRoom', { roomId: this.roomId });
        this.setInfoTxt("Code d'accès : " + this.roomId);
        this.initSocket();
    }
    /**
     * Démarrer le jeu
     * @private
     */
    Badminton.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rand, dataFinMatch;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Démarrage du jeu");
                        // Affichage des informations
                        $("#joueur1 p").text(this.player1.getNomJoueur());
                        $("#joueur2 p").text(this.player2.getNomJoueur());
                        rand = Math.floor(Math.random() * 2);
                        if (rand === 0)
                            this.service = this.player2;
                        else
                            this.service = this.player1;
                        this.service.toogleServe();
                        return [4 /*yield*/, sleep(2000)];
                    case 1:
                        _a.sent();
                        this.toggleService();
                        return [4 /*yield*/, sleep(2000)];
                    case 2:
                        _a.sent();
                        dataFinMatch = {
                            winner: 1,
                            time: 1541,
                            numberSet: 21,
                            gamesList: [
                                {
                                    player1: 1,
                                    player2: 0,
                                    time: 120,
                                    setsList: [
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 17,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 14,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 7,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 20,
                                            j2: 4,
                                            time: 60
                                        },
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 10,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 24,
                                            j2: 26,
                                            time: 60
                                        }
                                    ]
                                },
                                {
                                    player1: 1,
                                    player2: 1,
                                    time: 245,
                                    setsList: [
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 17,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 14,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 7,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 20,
                                            j2: 4,
                                            time: 60
                                        },
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 10,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 24,
                                            j2: 26,
                                            time: 60
                                        }
                                    ]
                                },
                                {
                                    player1: 2,
                                    player2: 1,
                                    time: 245,
                                    setsList: [
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 17,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 14,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 7,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 20,
                                            j2: 4,
                                            time: 60
                                        },
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 21,
                                            j2: 19,
                                            time: 60
                                        },
                                        {
                                            j1: 10,
                                            j2: 20,
                                            time: 60
                                        },
                                        {
                                            j1: 24,
                                            j2: 26,
                                            time: 60
                                        }
                                    ]
                                }
                            ]
                        };
                        //new PDFBad(dataFinMatch);
                        // Temporisation pour le début de la partie
                        return [4 /*yield*/, this.break(!dev ? 30 : 2)];
                    case 3:
                        //new PDFBad(dataFinMatch);
                        // Temporisation pour le début de la partie
                        _a.sent();
                        this.playSong();
                        // Debut du jeu avec entrainement
                        return [4 /*yield*/, this.train()];
                    case 4:
                        // Debut du jeu avec entrainement
                        _a.sent();
                        this.setInfoTxt("Début du jeu");
                        this.talk("Début du jeu");
                        this.talk(this.service.getNomJoueur() + " commence à servir");
                        // On démarre le jeu avec un nouveau set
                        this.inGame = true;
                        this.newSet(true);
                        this.startTimer();
                        this.numSets++;
                        setInterval(function () {
                            _this.talk("Mise en veille de l'écran");
                            alert('Mise en veille de l\'écran');
                        }, 6 * 60000);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Permet de faire les pauses
     * @param {number} time Temps de pause (En secondes)
     * @private
     */
    Badminton.prototype.break = function (time) {
        return __awaiter(this, void 0, void 0, function () {
            var inT;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.inGame = false;
                        if (time === undefined)
                            time = 5;
                        this.setInfoTxt("Pause de " + time + " secondes");
                        inT = setInterval(function () {
                            // @ts-ignore
                            time--;
                            // @ts-ignore
                            _this.setInfoTxt("Pause de " + time + " seconde" + (time > 1 ? "s" : ""));
                        }, 1000);
                        return [4 /*yield*/, sleep(time * 1000)];
                    case 1:
                        _a.sent();
                        this.talk("Fin de la pause");
                        clearInterval(inT);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Pause pour l'entrainement avant le match
     * @return {Promise<void>}
     * @private
     */
    Badminton.prototype.train = function () {
        return __awaiter(this, void 0, void 0, function () {
            var time, inT;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.inGame = false;
                        this.talk("Échauffement de 40 secondes");
                        time = !dev ? 40 : 2;
                        this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " secondes");
                        inT = setInterval(function () {
                            // @ts-ignore
                            time--;
                            _this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " seconde" + (time > 1 ? "s" : ""));
                        }, 1000);
                        return [4 /*yield*/, sleep(time * 1000)];
                    case 1:
                        _a.sent();
                        this.playSong();
                        this.talk("Début du point");
                        clearInterval(inT);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Démarrer le chronomètre de partie
     */
    Badminton.prototype.startTimer = function () {
        var _this = this;
        var chrono = setInterval(function () {
            if (!_this.inGame || _this.gameEnd)
                return;
            _this.timeStart++;
            $("#totalTime").text(formatTime(_this.timeStart));
        }, 1000);
    };
    /**
     * Permet de démarrer ou éteindre le chronomètre de set
     * @private
     */
    Badminton.prototype.toggleTimerSet = function () {
        var _this = this;
        if (this.chronoSet === null) {
            this.chronoSet = setInterval(function () {
                _this.timeSets++;
                $("#setsTime").text(formatTime(_this.timeSets));
            }, 1000);
        }
        else {
            clearInterval(this.chronoSet);
            this.chronoSet = null;
            this.timeSets = 0;
        }
    };
    /**
     * Permet de démarrer ou éteindre le chronomètre de points
     * @private
     */
    Badminton.prototype.toggleTimerPoint = function () {
        var _this = this;
        if (this.chronoPoint === null) {
            this.chronoPoint = setInterval(function () {
                _this.timePoints++;
                $("#pointTime").text(formatTime(_this.timePoints));
            }, 1000);
        }
        else {
            clearInterval(this.chronoPoint);
            this.chronoPoint = null;
            this.timePoints = 0;
        }
    };
    /**
     * Permet de démarrer un nouveau set
     * @private
     */
    Badminton.prototype.newSet = function () {
        return __awaiter(this, arguments, void 0, function (init) {
            var htmlPla1, htmlPla2, p1, p2, win, lose, winPlayer, losePlayer, newGameLog, newGameLog;
            if (init === void 0) { init = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Initialiser un nouveau set lors d'un nouveau jeu
                        if (init) {
                            this.timeSets = 0;
                            this.toggleTimerSet();
                            htmlPla1 = "\n            <div class=\"set set-p1\">\n    \n                <p>".concat(this.player1.getSet(), "</p>\n    \n            </div>\n    \n            <div class=\"game gam-p1\">\n    \n                <p>0</p>\n    \n            </div>\n            ");
                            htmlPla2 = "\n            <div class=\"set set-p2\">\n    \n                <p>".concat(this.player2.getSet(), "</p>\n    \n            </div>\n    \n            <div class=\"game gam-p2\">\n    \n                <p>0</p>\n    \n            </div>");
                            $("#ligne-j1").append(htmlPla1);
                            $("#ligne-j2").append(htmlPla2);
                            this.toggleTimerPoint();
                            this.inGame = true;
                            return [2 /*return*/];
                        }
                        p1 = this.player1.getSet();
                        p2 = this.player2.getSet();
                        if (!((p1 >= this.gameInfos.set && Math.abs(p1 - p2) >= 2) || (p2 >= this.gameInfos.set && Math.abs(p2 - p1) >= 2))) return [3 /*break*/, 8];
                        this.inGame = false;
                        this.toggleTimerSet();
                        this.toggleTimerPoint();
                        win = p1 > p2 ? 1 : 2;
                        lose = win === 1 ? 2 : 1;
                        winPlayer = (win === 1 ? this.player1 : this.player2);
                        losePlayer = (win === 1 ? this.player2 : this.player1);
                        $(".set-p" + win + " p").text(winPlayer.getSet());
                        $(".set-p" + lose + " p").text(losePlayer.getSet());
                        winPlayer.addScore();
                        if (!(winPlayer.getScore() === this.gameInfos.sets)) return [3 /*break*/, 2];
                        this.setInfoTxt("Le joueur " + winPlayer.getNomJoueur() + " a gagné le match !");
                        this.talk("Le joueur " + winPlayer.getNomJoueur() + " a gagné le match !");
                        newGameLog = {
                            player1: this.player1.getScore(),
                            player2: this.player2.getScore(),
                            time: this.timeSets,
                            setsList: this.logsSets
                        };
                        this.logsGames.push(newGameLog);
                        this.logMatch.gamesList = this.logsGames;
                        this.logMatch.numberSet = this.numSets - 1;
                        this.logMatch.time = this.timeStart;
                        this.logMatch.winner = win;
                        $(".gam-p2").remove();
                        $(".gam-p1").remove();
                        $(".set-p" + win).removeClass("set-p" + win).addClass("s-win");
                        $(".set-p" + lose).removeClass("set-p" + lose).addClass("s-lose");
                        return [4 /*yield*/, sleep(2000)];
                    case 1:
                        _a.sent();
                        this.gameEnd = true;
                        this.inGame = false;
                        return [2 /*return*/];
                    case 2:
                        this.setInfoTxt("Le joueur " + winPlayer.getNomJoueur() + " a gagné le jeu !");
                        this.talk("Le joueur " + winPlayer.getNomJoueur() + " a gagné le jeu !");
                        newGameLog = {
                            player1: this.player1.getScore(),
                            player2: this.player2.getScore(),
                            time: this.timeSets,
                            setsList: this.logsSets
                        };
                        this.logsGames.push(newGameLog);
                        this.logsSets = [];
                        $(".gam-p2").remove();
                        $(".gam-p1").remove();
                        $(".set-p" + win).removeClass("set-p" + win).addClass("s-win");
                        $(".set-p" + lose).removeClass("set-p" + lose).addClass("s-lose");
                        return [4 /*yield*/, sleep(2000)];
                    case 3:
                        _a.sent();
                        this.player1.resetSets();
                        this.player2.resetSets();
                        this.player1.resetPoint();
                        this.player2.resetPoint();
                        return [4 /*yield*/, this.break(dev ? 3 : 60)];
                    case 4:
                        _a.sent();
                        this.playSong();
                        this.setInfoTxt("Début du jeu " + (this.player2.getScore() + this.player1.getScore() + 1));
                        this.talk("Début du jeu " + (this.player2.getScore() + this.player1.getScore() + 1));
                        return [4 /*yield*/, sleep(2000)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.train()];
                    case 6:
                        _a.sent();
                        this.newSet(true);
                        _a.label = 7;
                    case 7: return [3 /*break*/, 12];
                    case 8:
                        this.toggleTimerSet();
                        this.toggleTimerPoint();
                        $(".set-p1 p").text(p1);
                        $(".set-p2 p").text(p2);
                        this.player1.resetPoint();
                        this.player2.resetPoint();
                        $(".gam-p1 p").text("0");
                        $(".gam-p2 p").text("0");
                        return [4 /*yield*/, this.break(!dev ? 45 : 2)];
                    case 9:
                        _a.sent();
                        this.playSong();
                        this.setInfoTxt("Début du set " + this.numSets);
                        this.talk("Début du set " + this.numSets);
                        return [4 /*yield*/, sleep(2000)];
                    case 10:
                        _a.sent();
                        this.timeSets = 0;
                        this.timePoints = 0;
                        return [4 /*yield*/, this.train()];
                    case 11:
                        _a.sent();
                        this.setInfoTxt("Début");
                        if (this.service !== null)
                            this.talk(this.service.getNomJoueur() + " sert");
                        this.toggleTimerSet();
                        this.toggleTimerPoint();
                        this.inGame = true;
                        _a.label = 12;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Lorsque le joueur marque un nouveau point
     * @param {number} player Numéro du joueur
     */
    Badminton.prototype.newPoint = function (player) {
        return __awaiter(this, void 0, void 0, function () {
            var playerN, otherPlayer, logedSet, playerLead, playerLose, txtPoint, scoreP1, scoreP2, txtBalle;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.inGame)
                            return [2 /*return*/];
                        playerN = (player === 1 ? this.player1 : this.player2);
                        otherPlayer = (player === 1 ? this.player2 : this.player1);
                        if (!(playerN.getPoint() + 1 >= this.gameInfos.points && Math.abs(playerN.getPoint() + 1 - otherPlayer.getPoint()) >= 2)) return [3 /*break*/, 1];
                        this.setInfoTxt("Fin du set pour " + playerN.getNomJoueur());
                        this.talk("Fin du set pour " + playerN.getNomJoueur());
                        playerN.addSet();
                        logedSet = {
                            j1: this.player1.getPoint(),
                            j2: this.player2.getPoint(),
                            time: this.timeSets
                        };
                        this.logsSets.push(logedSet);
                        this.numSets++;
                        $(".grid-all-points").html('');
                        playerLead = (playerN.getSet() > otherPlayer.getSet() ? playerN : otherPlayer);
                        playerLose = (playerN.getSet() > otherPlayer.getSet() ? otherPlayer : playerN);
                        this.talk(playerLead.getNomJoueur() + " mène " + playerLead.getSet() + " sets à " + playerLose.getSet());
                        this.newSet();
                        return [3 /*break*/, 3];
                    case 1:
                        this.inGame = false;
                        playerN.addPoint();
                        this.talk("Point pour " + playerN.getNomJoueur());
                        this.talk(playerN.getPoint() + " à " + otherPlayer.getPoint() + " pour " + playerN.getNomJoueur());
                        txtPoint = void 0;
                        if (player === 1) {
                            txtPoint = "<div class=\"item\">\n\n                    <div class=\"winner\">".concat(playerN.getPoint(), "</div>\n                    <div class=\"looser\"></div>\n        \n                </div>");
                        }
                        else {
                            txtPoint = "<div class=\"item\">\n\n                    <div class=\"looser\"></div>\n                    <div class=\"winner\">".concat(playerN.getPoint(), "</div>\n        \n                </div>");
                        }
                        if (this.lastPlayerWon !== null && this.lastPlayerWon === playerN) {
                            this.numberPoint++;
                            if (this.numberPoint >= 4) {
                                this.talk(this.numberPoint + 1 + " points consécutifs pour " + playerN.getNomJoueur());
                            }
                            this.talk(((_a = this.service) === null || _a === void 0 ? void 0 : _a.getNomJoueur()) + " sert");
                        }
                        else {
                            this.numberPoint = 0;
                            this.lastPlayerWon = playerN;
                            this.toggleService();
                        }
                        $(".grid-all-points").append(txtPoint);
                        $('.grid-all-points').scrollLeft($('.grid-all-points')[0].scrollWidth);
                        scoreP1 = this.player1.getPoint();
                        scoreP2 = this.player2.getPoint();
                        $(".gam-p1 p").text(scoreP1);
                        $(".gam-p2 p").text(scoreP2);
                        return [4 /*yield*/, sleep(2000)];
                    case 2:
                        _b.sent();
                        txtBalle = "set";
                        if (this.balleDeJeu(playerN, otherPlayer))
                            txtBalle = "jeu";
                        if (this.balleDeMatch(playerN, otherPlayer))
                            txtBalle = "match";
                        if (playerN.getPoint() == this.gameInfos.points - 1 && Math.abs(playerN.getPoint() - otherPlayer.getPoint()) > 1) {
                            this.setInfoTxt("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());
                            this.importantPoint();
                            this.talk("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());
                        }
                        else if (playerN.getPoint() >= this.gameInfos.points - 1 && Math.abs(playerN.getPoint() - otherPlayer.getPoint()) == 1) {
                            this.setInfoTxt("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());
                            this.importantPoint();
                            this.talk("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());
                        }
                        this.timePoints = 0;
                        this.inGame = true;
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enoncer le texte
     * @param {string} text
     * @private
     */
    Badminton.prototype.talk = function (text) {
        if (dev)
            return;
        // Check if the browser supports the Web Speech API
        if ('speechSynthesis' in window) {
            // Create a new instance of SpeechSynthesisUtterance
            var msg = new SpeechSynthesisUtterance();
            // Set the text you want to convert to speech
            msg.text = text;
            // Set the language (optional)
            msg.lang = 'fr-FR';
            // Vitesse
            msg.rate = 1.75;
            // Speak the text
            window.speechSynthesis.speak(msg);
        }
        else {
            alert('NON DISPO');
        }
    };
    /**
     * Modifier le texte d'information
     * @param {string} text Texte à afficher (Optionnel pour laisser vide)
     * @private
     */
    Badminton.prototype.setInfoTxt = function (text) {
        if (text === undefined)
            $("#info_txt").html('');
        else
            $("#info_txt").html(text);
    };
    /**
     * Permet de changer le service et l'indicateur
     * @private
     */
    Badminton.prototype.toggleService = function () {
        if (this.service === null)
            return;
        this.player2.toogleServe();
        this.player1.toogleServe();
        this.service = (this.service === this.player1 ? this.player2 : this.player1);
        console.log("Changement de service");
        console.log(this.player1.getServe());
        console.log(this.player2.getServe());
        $("img.serve-l").remove();
        if (this.player1.getServe()) {
            $("#joueur1").append('<img class="serve-l" src="icon/vol.svg" alt="Service" />');
            this.talk(this.player1.getNomJoueur() + " sert");
        }
        else {
            $("#joueur2").append('<img class="serve-l" src="icon/vol.svg" alt="Service" />');
            this.talk(this.player2.getNomJoueur() + " sert");
        }
        this.setInfoTxt(this.service.getNomJoueur() + " sert");
    };
    /**
     * Permet de joueur le signal sonore de début ou fin
     * @private
     */
    Badminton.prototype.playSong = function () {
        if (dev)
            return;
        // Jouer le fichier other/start.mp3
        var audio = new Audio('other/start.mp3');
        audio.play();
    };
    /**
     * Jouer le signal lorsqu'il s'agit d'un point important
     * @private
     */
    Badminton.prototype.importantPoint = function () {
        if (dev)
            return;
        var audio = new Audio('other/horn.mp3');
        audio.play();
    };
    /**
     * Retourne si il s'agit d'une balle de jeu
     * @return {boolean}
     * @private
     */
    Badminton.prototype.balleDeJeu = function (playPoint, otherPlay) {
        var p1 = playPoint.getSet();
        var p2 = otherPlay.getSet();
        return p1 + 1 >= this.gameInfos.set && p1 - p2 >= 1;
    };
    /**
     * Retourne si il s'agit d'une balle de match
     * @return {boolean}
     * @private
     */
    Badminton.prototype.balleDeMatch = function (playPoint, otherPlay) {
        var p1 = playPoint.getScore();
        console.log(p1);
        console.log(this.gameInfos.sets);
        console.log(typeof p1);
        console.log(typeof this.gameInfos.sets);
        console.log(this.balleDeJeu(playPoint, otherPlay));
        console.log(p1 + 1 === this.gameInfos.sets);
        return this.balleDeJeu(playPoint, otherPlay) && p1 + 1 === this.gameInfos.sets;
    };
    /**
     * Faire fonctionner les sockets
     * @private
     */
    Badminton.prototype.initSocket = function () {
        var _this = this;
        console.log(this.roomId);
        socket.on('confirmRoom', function () {
            $("button.go").show();
        });
        socket.on('fetchPlayerName', function () {
            var dataPlayer = {
                player1: _this.player1.getNomJoueur(),
                player2: _this.player2.getNomJoueur()
            };
            socket.emit('sendPlayersName', { roomId: _this.roomId }, dataPlayer);
        });
        socket.on('addPoint', function (player) {
            _this.newPoint(player);
        });
    };
    /**
     * Récupérer les informations du match à la fin du match
     * @return {dataLogMatch | null} Informations du match ou null si le match n'est pas terminé
     */
    Badminton.prototype.getMatchInfos = function () {
        if (!this.gameEnd)
            return null;
        return this.logMatch;
    };
    return Badminton;
}());
/**
 * Classe permettant de gérer les joueurs du jeu de badminton
 * @class BadmintonPlayer
 * @since 1.0
 * @version 1.0
 * @author Joey CAZO
 */
var BadmintonPlayer = /** @class */ (function () {
    function BadmintonPlayer(nomJoueur, sets, points) {
        this.nomJoueur = nomJoueur;
        this.score = 0;
        this.sets = 0;
        this.points = 0;
        this.serve = false;
        this.maxSet = sets;
        this.maxPoints = points;
    }
    /**
     * Ajouter un point au joueur
     */
    BadmintonPlayer.prototype.addPoint = function () {
        this.points++;
    };
    /**
     * Ajouter un set au joueur
     */
    BadmintonPlayer.prototype.addSet = function () {
        this.points = 0;
        this.sets++;
    };
    /**
     * Ajouter un jeu au joueur
     */
    BadmintonPlayer.prototype.addScore = function () {
        this.score++;
        this.points = 0;
        this.sets = 0;
    };
    /** Récupérer le nombre de points pour le jeu en cours */
    BadmintonPlayer.prototype.getPoint = function () { return this.points; };
    /** Récupérer le nombre de sets pour le jeu en cours */
    BadmintonPlayer.prototype.getSet = function () { return this.sets; };
    /** Récupérer le nombre de jeux pour le jeu en cours */
    BadmintonPlayer.prototype.getScore = function () { return this.score; };
    /**
     * Permet de forcer le nombre de set (Pour les tests)
     * @param {number} set
     */
    BadmintonPlayer.prototype.setSets = function (set) {
        this.sets = set;
    };
    /**
     * Permet de forcer le nombre de points (Pour les tests)
     * @param {number} point
     */
    BadmintonPlayer.prototype.setPoints = function (point) {
        this.points = point;
    };
    /**
     * Permet de récupérer le nom du joueur
     * @return {string} Nom du joueur
     */
    BadmintonPlayer.prototype.getNomJoueur = function () { return this.nomJoueur; };
    /**
     * Permet de savoir si le joueur sert
     * @return {boolean} Si le joueur sert
     */
    BadmintonPlayer.prototype.getServe = function () { return this.serve; };
    /**
     * Changer si le joueur sert ou non
     */
    BadmintonPlayer.prototype.toogleServe = function () {
        this.serve = !this.serve;
    };
    /** Permet de réinitialiser les points du joueur */
    BadmintonPlayer.prototype.resetPoint = function () {
        this.points = 0;
    };
    /** Permet de réinitialiser les sets du joueur */
    BadmintonPlayer.prototype.resetSets = function () {
        this.sets = 0;
    };
    return BadmintonPlayer;
}());
/********* EVENTS *********/
window.addEventListener('beforeunload', function (event) {
    var confirmationMessage = 'Êtes-vous sûr de vouloir quitter ou recharger la page ?';
    event.returnValue = confirmationMessage;
    return confirmationMessage;
});
