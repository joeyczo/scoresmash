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
/********* DÉPENDANCES *********/
/********* INTERFACES *********/
// @ts-ignore
var dev = false; // TODO : Changer
/** Match joué dans le cadre d'un tournoi (enchaînement automatique) */
var tournamentMode = false;
/** Un match est en cours (sert à n'avertir que pendant une partie) */
let matchInProgress = false;
/** Coupe l'avertissement de quitter le temps d'une navigation automatique */
let suppressUnload = false;
/********* METHODES *********/
/**
 * Début du jeu lors du click sur le bouton
 */
var clickBtn = () => {
    if (confirm('Démarrer la partie ?')) {
        let player1 = $("#player1").val();
        let player2 = $("#player2").val();
        let sets = $("#nbSets").val();
        let set = $("#nbJSets").val();
        let points = $("#nbPoints").val();
        // Paramètres avancés (accordéon)
        let training = $("#training").is(":checked");
        let timeTrain = Number($("#timeTrain").val());
        let pauseStart = Number($("#pauseStart").val());
        let pauseSet = Number($("#pauseSet").val());
        let pauseGame = Number($("#pauseGame").val());
        // Objet de partie
        let obj = {
            player1: (player1.length > 0 ? player1 : "Joueur 1"),
            player2: (player2.length > 0 ? player2 : "Joueur 2"),
            sets: (sets > 0 ? sets : 2),
            set: (set > 0 ? set : 6),
            points: (points > 0 ? points : 20),
            training: training,
            timeTrain: (timeTrain >= 0 ? timeTrain : 40),
            pauseStart: (pauseStart >= 0 ? pauseStart : 30),
            pauseSet: (pauseSet >= 0 ? pauseSet : 45),
            pauseGame: (pauseGame >= 0 ? pauseGame : 60),
            start: new Date()
        };
        // Nouveau match : on oublie toute partie en cours
        localStorage.removeItem("savedGame");
        // Envoi des informations
        sessionStorage.setItem("dataGame", JSON.stringify(obj));
        // Changement de page
        window.location.href = '/badminton';
    }
};
/** JEU */
let game;
let startGame = () => {
    // Mode tournoi : on joue le match assigné et on démarre automatiquement
    if (sessionStorage.getItem("tournament") === "1") {
        let dataGame = sessionStorage.getItem("dataGame");
        if (dataGame === null) {
            window.location.href = '/tournoi';
            return;
        }
        tournamentMode = true;
        game = new Badminton(JSON.parse(dataGame));
        startMatch();
        return;
    }
    // Reprise d'un match interrompu (rechargement, onglet vidé par le mobile, ...)
    let saved = localStorage.getItem("savedGame");
    if (saved !== null) {
        let savedObj = JSON.parse(saved);
        if (confirm("Un match est en cours. Voulez-vous le reprendre ?")) {
            game = new Badminton(savedObj.gameInfos);
            game.resume(savedObj);
            return;
        }
        // On exige une seconde confirmation avant d'écraser un match en cours
        if (!confirm("Démarrer un nouveau match ? Le match en cours sera perdu.")) {
            game = new Badminton(savedObj.gameInfos);
            game.resume(savedObj);
            return;
        }
        localStorage.removeItem("savedGame");
    }
    let dataGame = sessionStorage.getItem("dataGame");
    if (dataGame === null) {
        window.location.href = '/';
        return;
    }
    let obj = JSON.parse(dataGame);
    game = new Badminton(obj);
};
var randomUID = (taille = 20) => {
    var uid = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < taille; i++) {
        uid += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return uid;
};
let clickScore = (player) => {
    if (game === undefined)
        return;
    game.newPoint(player);
};
let clickUndo = (player) => {
    if (game === undefined)
        return;
    game.undoLastPoint(player);
};
let downloadPDF = () => {
    window.open('/pdfBad', '_blank');
};
/** Verrou empêchant la mise en veille de l'écran pendant un match */
let wakeLock = null;
/** Indique si l'on souhaite garder l'écran allumé (pour ré-acquérir le verrou) */
let wantWakeLock = false;
let requestWakeLock = () => __awaiter(void 0, void 0, void 0, function* () {
    wantWakeLock = true;
    try {
        let nav = navigator;
        if ('wakeLock' in nav)
            wakeLock = yield nav.wakeLock.request('screen');
    }
    catch (e) { /* Non supporté ou refusé : on ignore */ }
});
let releaseWakeLock = () => {
    wantWakeLock = false;
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
};
// Le verrou est libéré quand l'onglet est masqué : on le ré-acquiert au retour
document.addEventListener('visibilitychange', () => {
    if (wantWakeLock && document.visibilityState === 'visible')
        requestWakeLock();
});
let startMatch = () => {
    matchInProgress = true;
    game.start();
    $("button.go").hide();
    requestWakeLock();
};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Seconde vers HH:mm:ss
 * @param {number} secondes
 * @return {string}
 */
var formatTime = (secondes) => {
    const heures = Math.floor(secondes / 3600);
    const minutes = Math.floor((secondes % 3600) / 60);
    const secs = secondes % 60;
    const formattedHours = String(heures).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};
/********* CLASSES *********/
/**
 * Classe du jeu de badminton permettant de gérer les actions et les joueurs
 * @class Badminton
 * @since 1.0
 * @version 1.0
 * @author Joey CAZO
 */
class Badminton {
    constructor(gameInfos) {
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
        this.currentSetPoints = [];
        this.logMatch = {
            winner: "",
            player1Name: gameInfos.player1,
            player2Name: gameInfos.player2,
            pointsPerSet: Number(gameInfos.points),
            setsPerGame: Number(gameInfos.set),
            gamesToWin: Number(gameInfos.sets),
            time: 0,
            numberSet: 0,
            gamesList: []
        };
        this.numSets = 0;
        this.history = [];
        this.actionGen = 0;
        this.pauseInterval = null;
        $("#startBtn").show();
    }
    /**
     * Démarrer le jeu
     * @private
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Démarrage du jeu");
            // Affichage des informations
            $("#joueur1 p").text(this.player1.getNomJoueur());
            $("#joueur2 p").text(this.player2.getNomJoueur());
            // Choix du joueur qui sert en premier
            let rand = Math.floor(Math.random() * 2);
            if (rand === 0)
                this.service = this.player2;
            else
                this.service = this.player1;
            this.service.toogleServe();
            yield sleep(2000);
            this.toggleService();
            yield sleep(2000);
            // Temporisation pour le début de la partie
            yield this.break(!dev ? this.gameInfos.pauseStart : 2);
            this.playSong();
            // Debut du jeu avec entrainement
            yield this.train();
            this.setInfoTxt("Début du jeu");
            this.talk("Début du jeu");
            this.talk(this.service.getNomJoueur() + " commence à servir");
            // On démarre le jeu avec un nouveau set
            this.inGame = true;
            this.newSet(true);
            this.startTimer();
            this.numSets++;
        });
    }
    /**
     * Permet de faire les pauses
     * @param {number} time Temps de pause (En secondes)
     * @private
     */
    break(time) {
        return __awaiter(this, void 0, void 0, function* () {
            this.inGame = false;
            let gen = this.actionGen;
            if (time === undefined)
                time = 5;
            this.setInfoTxt("Pause de " + time + " secondes");
            this.pauseInterval = setInterval(() => {
                // @ts-ignore
                time--;
                // @ts-ignore
                this.setInfoTxt("Pause de " + time + " seconde" + (time > 1 ? "s" : ""));
            }, 1000);
            yield sleep(time * 1000);
            if (this.pauseInterval !== null) {
                clearInterval(this.pauseInterval);
                this.pauseInterval = null;
            }
            if (gen !== this.actionGen)
                return;
            this.talk("Fin de la pause");
        });
    }
    /**
     * Pause pour l'entrainement avant le match
     * @return {Promise<void>}
     * @private
     */
    train() {
        return __awaiter(this, void 0, void 0, function* () {
            this.inGame = false;
            let gen = this.actionGen;
            let time = !dev ? (this.gameInfos.training ? this.gameInfos.timeTrain : 0) : 2;
            if (time > 0) {
                this.talk("Échauffement de " + time + " secondes");
                this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " secondes");
            }
            this.pauseInterval = setInterval(() => {
                // @ts-ignore
                time--;
                this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " seconde" + (time > 1 ? "s" : ""));
            }, 1000);
            yield sleep(time * 1000);
            if (this.pauseInterval !== null) {
                clearInterval(this.pauseInterval);
                this.pauseInterval = null;
            }
            if (gen !== this.actionGen)
                return;
            this.playSong();
            this.talk("Début du point");
        });
    }
    /**
     * Démarrer le chronomètre de partie
     */
    startTimer() {
        let chrono = setInterval(() => {
            if (!this.inGame || this.gameEnd)
                return;
            this.timeStart++;
            $("#totalTime").text(formatTime(this.timeStart));
        }, 1000);
    }
    /**
     * Permet de démarrer ou éteindre le chronomètre de set
     * @private
     */
    toggleTimerSet() {
        if (this.chronoSet === null) {
            this.chronoSet = setInterval(() => {
                this.timeSets++;
                $("#setsTime").text(formatTime(this.timeSets));
            }, 1000);
        }
        else {
            clearInterval(this.chronoSet);
            this.chronoSet = null;
            this.timeSets = 0;
        }
    }
    /**
     * Permet de démarrer ou éteindre le chronomètre de points
     * @private
     */
    toggleTimerPoint() {
        if (this.chronoPoint === null) {
            this.chronoPoint = setInterval(() => {
                this.timePoints++;
                $("#pointTime").text(formatTime(this.timePoints));
            }, 1000);
        }
        else {
            clearInterval(this.chronoPoint);
            this.chronoPoint = null;
            this.timePoints = 0;
        }
    }
    /**
     * Permet de démarrer un nouveau set
     * @private
     */
    newSet() {
        return __awaiter(this, arguments, void 0, function* (init = false) {
            var _a;
            // Initialiser un nouveau set lors d'un nouveau jeu
            if (init) {
                this.timeSets = 0;
                this.toggleTimerSet();
                let htmlPla1 = `
            <div class="set set-p1">
    
                <p>${this.player1.getSet()}</p>
    
            </div>
    
            <div class="game gam-p1">
    
                <p>0</p>
    
            </div>
            `;
                let htmlPla2 = `
            <div class="set set-p2">
    
                <p>${this.player2.getSet()}</p>
    
            </div>
    
            <div class="game gam-p2">
    
                <p>0</p>
    
            </div>`;
                $("#ligne-j1").append(htmlPla1);
                $("#ligne-j2").append(htmlPla2);
                this.toggleTimerPoint();
                this.inGame = true;
                this.saveState();
                return;
            }
            let gen = this.actionGen;
            let p1 = this.player1.getSet();
            let p2 = this.player2.getSet();
            if ((p1 >= this.gameInfos.set && Math.abs(p1 - p2) >= 2) || (p2 >= this.gameInfos.set && Math.abs(p2 - p1) >= 2)) {
                this.inGame = false;
                this.toggleTimerSet();
                this.toggleTimerPoint();
                let win = p1 > p2 ? 1 : 2;
                let lose = win === 1 ? 2 : 1;
                let winPlayer = (win === 1 ? this.player1 : this.player2);
                let losePlayer = (win === 1 ? this.player2 : this.player1);
                $(".set-p" + win + " p").text(winPlayer.getSet());
                $(".set-p" + lose + " p").text(losePlayer.getSet());
                winPlayer.addScore();
                if (winPlayer.getScore() === this.gameInfos.sets) {
                    this.setInfoTxt("Le joueur " + winPlayer.getNomJoueur() + " a gagné le match !");
                    this.talk("Le joueur " + winPlayer.getNomJoueur() + " a gagné le match !");
                    let newGameLog = {
                        player1: this.player1.getScore(),
                        player2: this.player2.getScore(),
                        time: this.timeSets,
                        setsList: this.logsSets
                    };
                    this.logsGames.push(newGameLog);
                    this.logMatch.gamesList = this.logsGames;
                    this.logMatch.numberSet = this.numSets - 1;
                    this.logMatch.time = this.timeStart;
                    this.logMatch.winner = winPlayer.getNomJoueur();
                    $(".gam-p2").remove();
                    $(".gam-p1").remove();
                    $(".set-p" + win).removeClass("set-p" + win).addClass("s-win");
                    $(".set-p" + lose).removeClass("set-p" + lose).addClass("s-lose");
                    yield sleep(2000);
                    if (gen !== this.actionGen)
                        return;
                    this.gameEnd = true;
                    this.inGame = false;
                    // Match terminé : plus rien à reprendre, on libère l'écran
                    localStorage.removeItem("savedGame");
                    releaseWakeLock();
                    this.updateUndoButtons();
                    matchInProgress = false;
                    if (tournamentMode) {
                        tournoiReportAndReturn(win, this.player1.getScore(), this.player2.getScore());
                        return;
                    }
                    this.printPDFMatch();
                    return;
                }
                else {
                    this.setInfoTxt("Le joueur " + winPlayer.getNomJoueur() + " a gagné le jeu !");
                    this.talk("Le joueur " + winPlayer.getNomJoueur() + " a gagné le jeu !");
                    let newGameLog = {
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
                    yield sleep(2000);
                    if (gen !== this.actionGen)
                        return;
                    this.player1.resetSets();
                    this.player2.resetSets();
                    this.player1.resetPoint();
                    this.player2.resetPoint();
                    yield this.break(!dev ? this.gameInfos.pauseGame : 3);
                    if (gen !== this.actionGen)
                        return;
                    this.playSong();
                    this.setInfoTxt("Début du jeu " + (this.player2.getScore() + this.player1.getScore() + 1));
                    this.talk("Début du jeu " + (this.player2.getScore() + this.player1.getScore() + 1));
                    this.talk(((_a = this.service) === null || _a === void 0 ? void 0 : _a.getNomJoueur()) + " sert");
                    yield sleep(2000);
                    if (gen !== this.actionGen)
                        return;
                    yield this.train();
                    if (gen !== this.actionGen)
                        return;
                    this.newSet(true);
                }
            }
            else {
                this.toggleTimerSet();
                this.toggleTimerPoint();
                $(".set-p1 p").text(p1);
                $(".set-p2 p").text(p2);
                this.player1.resetPoint();
                this.player2.resetPoint();
                $(".gam-p1 p").text("0");
                $(".gam-p2 p").text("0");
                yield this.break(!dev ? this.gameInfos.pauseSet : 2);
                if (gen !== this.actionGen)
                    return;
                this.playSong();
                this.setInfoTxt("Début du set " + this.numSets);
                this.talk("Début du set " + this.numSets);
                yield sleep(2000);
                if (gen !== this.actionGen)
                    return;
                this.timeSets = 0;
                this.timePoints = 0;
                yield this.train();
                if (gen !== this.actionGen)
                    return;
                this.setInfoTxt("Début");
                if (this.service !== null)
                    this.talk(this.service.getNomJoueur() + " sert");
                this.toggleTimerSet();
                this.toggleTimerPoint();
                this.inGame = true;
                this.saveState();
            }
        });
    }
    /**
     * Lorsque le joueur marque un nouveau point
     * @param {number} player Numéro du joueur
     */
    newPoint(player) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.inGame)
                return;
            // Instantané de l'état avant le point + activation de l'annulation pour ce marqueur
            this.pushSnapshot(player);
            let gen = ++this.actionGen;
            this.updateUndoButtons();
            // Enregistrement de l'échange pour le déroulé du set
            this.currentSetPoints.push(player);
            let playerN = (player === 1 ? this.player1 : this.player2);
            let otherPlayer = (player === 1 ? this.player2 : this.player1);
            if (playerN.getPoint() + 1 >= this.gameInfos.points && Math.abs(playerN.getPoint() + 1 - otherPlayer.getPoint()) >= 2) {
                this.setInfoTxt("Fin du set pour " + playerN.getNomJoueur());
                this.talk("Fin du set pour " + playerN.getNomJoueur());
                let logedSet = {
                    j1: this.player1.getPoint(),
                    j2: this.player2.getPoint(),
                    time: this.timeSets,
                    points: this.currentSetPoints.slice()
                };
                this.logsSets.push(logedSet);
                this.currentSetPoints = [];
                this.numSets++;
                playerN.addSet();
                $(".grid-all-points").html('');
                let playerLead = (playerN.getSet() > otherPlayer.getSet() ? playerN : otherPlayer);
                let playerLose = (playerN.getSet() > otherPlayer.getSet() ? otherPlayer : playerN);
                this.talk(playerLead.getNomJoueur() + " mène " + playerLead.getSet() + " sets à " + playerLose.getSet());
                this.newSet();
            }
            else {
                this.inGame = false;
                playerN.addPoint();
                this.talk("Point pour " + playerN.getNomJoueur());
                this.talk(playerN.getPoint() + " à " + otherPlayer.getPoint() + " pour " + playerN.getNomJoueur());
                let txtPoint;
                if (player === 1) {
                    txtPoint = `<div class="item">

                    <div class="winner">${playerN.getPoint()}</div>
                    <div class="looser"></div>
        
                </div>`;
                }
                else {
                    txtPoint = `<div class="item">

                    <div class="looser"></div>
                    <div class="winner">${playerN.getPoint()}</div>
        
                </div>`;
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
                let scoreP1 = this.player1.getPoint();
                let scoreP2 = this.player2.getPoint();
                $(".gam-p1 p").text(scoreP1);
                $(".gam-p2 p").text(scoreP2);
                yield sleep(2000);
                if (gen !== this.actionGen)
                    return;
                let txtBalle = "set";
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
                this.saveState();
            }
        });
    }
    /**
     * Enoncer le texte
     * @param {string} text
     * @private
     */
    talk(text) {
        if (dev)
            return;
        // Check if the browser supports the Web Speech API
        if ('speechSynthesis' in window) {
            // Create a new instance of SpeechSynthesisUtterance
            const msg = new SpeechSynthesisUtterance();
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
    }
    /**
     * Modifier le texte d'information
     * @param {string} text Texte à afficher (Optionnel pour laisser vide)
     * @private
     */
    setInfoTxt(text) {
        if (text === undefined)
            $("#info_txt").html('');
        else
            $("#info_txt").html(text);
    }
    /**
     * Permet de changer le service et l'indicateur
     * @private
     */
    toggleService() {
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
    }
    /**
     * Permet de joueur le signal sonore de début ou fin
     * @private
     */
    playSong() {
        if (dev)
            return;
        // Jouer le fichier other/start.mp3
        let audio = new Audio('other/start.mp3');
        audio.play();
    }
    /**
     * Jouer le signal lorsqu'il s'agit d'un point important
     * @private
     */
    importantPoint() {
        if (dev)
            return;
        let audio = new Audio('other/horn.mp3');
        audio.play();
    }
    /**
     * Retourne si il s'agit d'une balle de jeu
     * @return {boolean}
     * @private
     */
    balleDeJeu(playPoint, otherPlay) {
        let p1 = playPoint.getSet();
        let p2 = otherPlay.getSet();
        return p1 + 1 >= this.gameInfos.set && p1 - p2 >= 1;
    }
    /**
     * Retourne si il s'agit d'une balle de match
     * @return {boolean}
     * @private
     */
    balleDeMatch(playPoint, otherPlay) {
        let p1 = playPoint.getScore();
        console.log(p1);
        console.log(this.gameInfos.sets);
        console.log(typeof p1);
        console.log(typeof this.gameInfos.sets);
        console.log(this.balleDeJeu(playPoint, otherPlay));
        console.log(p1 + 1 === this.gameInfos.sets);
        return this.balleDeJeu(playPoint, otherPlay) && p1 + 1 === this.gameInfos.sets;
    }
    /**
     * Récupérer les informations du match à la fin du match
     * @return {dataLogMatch | null} Informations du match ou null si le match n'est pas terminé
     */
    getMatchInfos() {
        if (!this.gameEnd)
            return null;
        return this.logMatch;
    }
    printPDFMatch(dataToPrint) {
        localStorage.setItem("dataMatch", JSON.stringify(dataToPrint === undefined ? this.logMatch : dataToPrint));
        // Affichage du bouton de téléchargement (ouverture déclenchée par le clic, jamais bloquée)
        $("#pdfBtn").show();
    }
    /**
     * Empile un instantané de l'état complet du jeu avant un point
     * @param {number} player Joueur qui s'apprête à marquer
     * @private
     */
    pushSnapshot(player) {
        let snap = {
            p1: this.player1.snapshot(),
            p2: this.player2.snapshot(),
            scorerIs1: player === 1,
            serviceIs1: this.service === null ? null : this.service === this.player1,
            lastWonIs1: this.lastPlayerWon === null ? null : this.lastPlayerWon === this.player1,
            numberPoint: this.numberPoint,
            timeSets: this.timeSets,
            timePoints: this.timePoints,
            numSets: this.numSets,
            gameEnd: this.gameEnd,
            setPoints: this.currentSetPoints.slice(),
            logsSets: this.logsSets.slice(),
            logsGames: this.logsGames.slice(),
            ligneJ1: $("#ligne-j1").html(),
            ligneJ2: $("#ligne-j2").html(),
            grid: $(".grid-all-points").html(),
            info: $("#info_txt").html()
        };
        this.history.push(snap);
    }
    /**
     * Restaure l'état du jeu à partir d'un instantané
     * @param {gameSnapshot} snap
     * @private
     */
    restoreSnapshot(snap) {
        this.player1.restore(snap.p1);
        this.player2.restore(snap.p2);
        this.service = snap.serviceIs1 === null ? null : (snap.serviceIs1 ? this.player1 : this.player2);
        this.lastPlayerWon = snap.lastWonIs1 === null ? null : (snap.lastWonIs1 ? this.player1 : this.player2);
        this.numberPoint = snap.numberPoint;
        this.timeSets = snap.timeSets;
        this.timePoints = snap.timePoints;
        this.numSets = snap.numSets;
        this.gameEnd = snap.gameEnd;
        this.currentSetPoints = snap.setPoints.slice();
        this.logsSets = snap.logsSets.slice();
        this.logsGames = snap.logsGames.slice();
        // Le innerHTML rétablit l'affichage exact (colonnes, frise, icône de service)
        $("#ligne-j1").html(snap.ligneJ1);
        $("#ligne-j2").html(snap.ligneJ2);
        $(".grid-all-points").html(snap.grid);
        $("#info_txt").html(snap.info);
        $("#setsTime").text(formatTime(this.timeSets));
        $("#pointTime").text(formatTime(this.timePoints));
    }
    /**
     * Annule le dernier point. N'a d'effet que si le joueur visé est bien le dernier marqueur.
     * @param {number} player Numéro du joueur dont on veut retirer le point
     */
    undoLastPoint(player) {
        if (this.gameEnd)
            return;
        if (this.history.length === 0)
            return;
        let snap = this.history[this.history.length - 1];
        // On ne peut retirer que le point du dernier marqueur
        if (snap.scorerIs1 !== (player === 1))
            return;
        let scorer = snap.scorerIs1 ? this.player1 : this.player2;
        if (!confirm("Retirer le dernier point de " + scorer.getNomJoueur() + " ?"))
            return;
        this.history.pop();
        // Invalide les séquences async en cours et coupe le décompte/la voix
        this.actionGen++;
        this.abortPending();
        this.restoreSnapshot(snap);
        this.inGame = true;
        this.ensureTimersRunning();
        // Après restauration, getPoint() vaut le score d'avant le point retiré
        this.talk("Un point a été retiré à " + scorer.getNomJoueur() + ", le nouveau score est " + scorer.getPoint());
        this.updateUndoButtons();
        this.saveState();
    }
    /**
     * Coupe le décompte de pause en cours et vide la file vocale en attente
     * @private
     */
    abortPending() {
        if (this.pauseInterval !== null) {
            clearInterval(this.pauseInterval);
            this.pauseInterval = null;
        }
        if (!dev && 'speechSynthesis' in window)
            window.speechSynthesis.cancel();
    }
    /**
     * Relance les chronos de set et de point s'ils ont été arrêtés par une transition annulée
     * @private
     */
    ensureTimersRunning() {
        if (this.chronoSet === null) {
            this.chronoSet = setInterval(() => {
                this.timeSets++;
                $("#setsTime").text(formatTime(this.timeSets));
            }, 1000);
        }
        if (this.chronoPoint === null) {
            this.chronoPoint = setInterval(() => {
                this.timePoints++;
                $("#pointTime").text(formatTime(this.timePoints));
            }, 1000);
        }
    }
    /**
     * Active le bouton d'annulation du dernier marqueur uniquement, désactive l'autre
     * @private
     */
    updateUndoButtons() {
        let last = this.history.length > 0 ? this.history[this.history.length - 1] : null;
        let en1 = !this.gameEnd && last !== null && last.scorerIs1;
        let en2 = !this.gameEnd && last !== null && !last.scorerIs1;
        $("#undo-j1").prop("disabled", !en1);
        $("#undo-j2").prop("disabled", !en2);
    }
    /**
     * Capture l'état complet du match (logique + affichage) pour la reprise
     * @return {savedGame}
     * @private
     */
    captureState() {
        return {
            gameInfos: this.gameInfos,
            p1: this.player1.snapshot(),
            p2: this.player2.snapshot(),
            serviceIs1: this.service === null ? null : this.service === this.player1,
            lastWonIs1: this.lastPlayerWon === null ? null : this.lastPlayerWon === this.player1,
            numberPoint: this.numberPoint,
            timeStart: this.timeStart,
            timeSets: this.timeSets,
            timePoints: this.timePoints,
            gameEnd: this.gameEnd,
            numSets: this.numSets,
            setPoints: this.currentSetPoints.slice(),
            logsSets: this.logsSets.slice(),
            logsGames: this.logsGames.slice(),
            logMatch: this.logMatch,
            ligneJ1: $("#ligne-j1").html(),
            ligneJ2: $("#ligne-j2").html(),
            grid: $(".grid-all-points").html(),
            info: $("#info_txt").html()
        };
    }
    /**
     * Sauvegarde le match en cours dans le localStorage (survit au rechargement)
     * @private
     */
    saveState() {
        if (this.gameEnd)
            return;
        localStorage.setItem("savedGame", JSON.stringify(this.captureState()));
    }
    /**
     * Reprend un match interrompu à partir de sa sauvegarde
     * @param {savedGame} saved
     */
    resume(saved) {
        $("#startBtn").hide();
        this.player1.restore(saved.p1);
        this.player2.restore(saved.p2);
        this.service = saved.serviceIs1 === null ? null : (saved.serviceIs1 ? this.player1 : this.player2);
        this.lastPlayerWon = saved.lastWonIs1 === null ? null : (saved.lastWonIs1 ? this.player1 : this.player2);
        this.numberPoint = saved.numberPoint;
        this.timeStart = saved.timeStart;
        this.timeSets = saved.timeSets;
        this.timePoints = saved.timePoints;
        this.gameEnd = saved.gameEnd;
        this.numSets = saved.numSets;
        this.currentSetPoints = saved.setPoints.slice();
        this.logsSets = saved.logsSets.slice();
        this.logsGames = saved.logsGames.slice();
        this.logMatch = saved.logMatch;
        // Le innerHTML rétablit l'affichage exact (colonnes, frise, noms, service)
        $("#ligne-j1").html(saved.ligneJ1);
        $("#ligne-j2").html(saved.ligneJ2);
        $(".grid-all-points").html(saved.grid);
        $("#info_txt").html(saved.info);
        $("#totalTime").text(formatTime(this.timeStart));
        $("#setsTime").text(formatTime(this.timeSets));
        $("#pointTime").text(formatTime(this.timePoints));
        // L'historique d'annulation n'est pas conservé entre deux sessions
        this.history = [];
        this.updateUndoButtons();
        this.inGame = true;
        this.startTimer();
        this.ensureTimersRunning();
        requestWakeLock();
    }
}
/**
 * Classe permettant de gérer les joueurs du jeu de badminton
 * @class BadmintonPlayer
 * @since 1.0
 * @version 1.0
 * @author Joey CAZO
 */
class BadmintonPlayer {
    constructor(nomJoueur, sets, points) {
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
    addPoint() {
        this.points++;
    }
    /**
     * Ajouter un set au joueur
     */
    addSet() {
        this.points = 0;
        this.sets++;
    }
    /**
     * Ajouter un jeu au joueur
     */
    addScore() {
        this.score++;
        this.points = 0;
        this.sets = 0;
    }
    /** Récupérer le nombre de points pour le jeu en cours */
    getPoint() { return this.points; }
    /** Récupérer le nombre de sets pour le jeu en cours */
    getSet() { return this.sets; }
    /** Récupérer le nombre de jeux pour le jeu en cours */
    getScore() { return this.score; }
    /**
     * Permet de forcer le nombre de set (Pour les tests)
     * @param {number} set
     */
    setSets(set) {
        this.sets = set;
    }
    /**
     * Permet de forcer le nombre de points (Pour les tests)
     * @param {number} point
     */
    setPoints(point) {
        this.points = point;
    }
    /**
     * Permet de récupérer le nom du joueur
     * @return {string} Nom du joueur
     */
    getNomJoueur() { return this.nomJoueur; }
    /**
     * Permet de savoir si le joueur sert
     * @return {boolean} Si le joueur sert
     */
    getServe() { return this.serve; }
    /**
     * Changer si le joueur sert ou non
     */
    toogleServe() {
        this.serve = !this.serve;
    }
    /** Permet de réinitialiser les points du joueur */
    resetPoint() {
        this.points = 0;
    }
    /** Permet de réinitialiser les sets du joueur */
    resetSets() {
        this.sets = 0;
    }
    /**
     * Instantané des compteurs du joueur (pour l'annulation d'un point)
     * @return {playerSnapshot}
     */
    snapshot() {
        return { score: this.score, sets: this.sets, points: this.points, serve: this.serve };
    }
    /**
     * Restaure les compteurs du joueur à partir d'un instantané
     * @param {playerSnapshot} s
     */
    restore(s) {
        this.score = s.score;
        this.sets = s.sets;
        this.points = s.points;
        this.serve = s.serve;
    }
}
/**
 * Énoncer un texte (version autonome, utilisée par le tableau de tournoi)
 * @param {string} text
 */
let speak = (text) => {
    if (dev)
        return;
    if ('speechSynthesis' in window) {
        let msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.lang = 'fr-FR';
        msg.rate = 1.4;
        window.speechSynthesis.speak(msg);
    }
};
/** Libellé d'un tour de phase finale selon le nombre de joueurs */
let tournoiPhaseLabel = (size) => {
    switch (size) {
        case 2: return "Finale";
        case 4: return "Demi-finale";
        case 8: return "Quart de finale";
        case 16: return "Huitième de finale";
        case 32: return "Seizième de finale";
        default: return "Tour à " + size;
    }
};
/** Charger l'état du tournoi en cours */
let tournoiLoad = () => {
    let raw = localStorage.getItem("savedTournament");
    return raw === null ? null : JSON.parse(raw);
};
/** Sauvegarder l'état du tournoi */
let tournoiSave = (st) => {
    localStorage.setItem("savedTournament", JSON.stringify(st));
};
/** Mélanger un tableau (Fisher-Yates) */
let tournoiShuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};
/** Tailles de phase finale possibles (puissances de 2 ≤ nombre de joueurs) */
let tournoiFinalSizes = (nbPlayers) => {
    let sizes = [];
    for (let s = 2; s <= nbPlayers; s *= 2)
        sizes.push(s);
    return sizes;
};
/** Générer les matchs de poule (paires aléatoires, sans répéter la paire précédente) */
let tournoiBuildPoule = (nbPlayers, count) => {
    let matches = [];
    let prev = "";
    for (let k = 0; k < count; k++) {
        let a = 0, b = 0, key = "", tries = 0;
        do {
            a = Math.floor(Math.random() * nbPlayers);
            b = Math.floor(Math.random() * nbPlayers);
            key = Math.min(a, b) + "-" + Math.max(a, b);
            tries++;
        } while ((a === b || key === prev) && tries < 50);
        prev = key;
        matches.push({ p1: a, p2: b, winner: null, phase: "Poule", s1: 0, s2: 0 });
    }
    return matches;
};
/** Construire un tour de phase finale (tête de série n°1 contre dernier qualifié) */
let tournoiBuildFinalRound = (st) => {
    let rp = st.roundPlayers;
    let size = rp.length;
    let label = tournoiPhaseLabel(size);
    for (let i = 0; i < size / 2; i++) {
        st.matches.push({ p1: rp[i], p2: rp[size - 1 - i], winner: null, phase: label, s1: 0, s2: 0 });
    }
};
/** Démarrer la phase finale à partir des qualifiés (déjà classés en têtes de série) */
let tournoiStartFinal = (st) => {
    st.roundPlayers = st.qualified.slice();
    st.stage = "final";
    tournoiBuildFinalRound(st);
};
/** À la fin de la poule : déterminer les qualifiés (et un éventuel barrage) */
let tournoiBuildAfterPoule = (st) => {
    let order = st.players.map((_, i) => i).sort((a, b) => st.players[b].wins - st.players[a].wins);
    let N = st.finalSize;
    let cutoff = st.players[order[N - 1]].wins;
    let auto = order.filter(i => st.players[i].wins > cutoff);
    let tied = order.filter(i => st.players[i].wins === cutoff);
    let spots = N - auto.length;
    st.qualified = auto.slice();
    if (spots >= tied.length) {
        // Tous les ex æquo passent : pas de barrage
        st.qualified = st.qualified.concat(tied.slice(0, spots));
        tournoiStartFinal(st);
    }
    else {
        // Barrage : mini round-robin entre les ex æquo pour les places restantes
        st.barrageGroup = tournoiShuffle(tied.slice());
        st.barrageSpots = spots;
        for (let a = 0; a < st.barrageGroup.length; a++) {
            for (let b = a + 1; b < st.barrageGroup.length; b++) {
                st.matches.push({ p1: st.barrageGroup[a], p2: st.barrageGroup[b], winner: null, phase: "Barrage", s1: 0, s2: 0 });
            }
        }
        st.stage = "barrage";
    }
};
/** À la fin du barrage : classer les ex æquo et compléter les qualifiés */
let tournoiResolveBarrage = (st) => {
    let bwins = {};
    st.barrageGroup.forEach(i => bwins[i] = 0);
    st.matches.filter(m => m.phase === "Barrage" && m.winner !== null).forEach(m => {
        if (bwins[m.winner] !== undefined)
            bwins[m.winner]++;
    });
    let ranked = st.barrageGroup.slice().sort((a, b) => bwins[b] - bwins[a]);
    st.qualified = st.qualified.concat(ranked.slice(0, st.barrageSpots));
    tournoiStartFinal(st);
};
/** Construire le tour suivant de la phase finale, ou désigner le champion */
let tournoiBuildNextFinalRound = (st) => {
    let n = st.roundPlayers.length / 2;
    let lastRound = st.matches.slice(st.matches.length - n);
    let winners = lastRound.map(m => m.winner);
    if (winners.length === 1) {
        st.champion = st.players[winners[0]].name;
        st.stage = "done";
        return false;
    }
    st.roundPlayers = winners;
    tournoiBuildFinalRound(st);
    return true;
};
/** Renvoyer le prochain match à jouer (en générant les phases au besoin) */
let tournoiEnsureNext = (st) => {
    while (true) {
        if (st.cursor < st.matches.length && st.matches[st.cursor].winner === null) {
            return st.matches[st.cursor];
        }
        if (st.stage === "poule")
            tournoiBuildAfterPoule(st);
        else if (st.stage === "barrage")
            tournoiResolveBarrage(st);
        else if (st.stage === "final") {
            if (!tournoiBuildNextFinalRound(st))
                return null;
        }
        else
            return null;
    }
};
/** Enregistrer le vainqueur du match courant et revenir au tableau */
let tournoiReportAndReturn = (winSide, gamesP1, gamesP2) => {
    let st = tournoiLoad();
    if (st === null) {
        window.location.href = '/tournoi';
        return;
    }
    let m = st.matches[st.cursor];
    let wi = winSide === 1 ? m.p1 : m.p2;
    let li = winSide === 1 ? m.p2 : m.p1;
    m.winner = wi;
    m.s1 = gamesP1;
    m.s2 = gamesP2;
    st.players[wi].wins++;
    st.players[li].losses++;
    st.cursor++;
    tournoiSave(st);
    sessionStorage.setItem("tournoiAuto", "1");
    sessionStorage.removeItem("tournament");
    sessionStorage.removeItem("dataGame");
    localStorage.removeItem("savedGame");
    suppressUnload = true;
    window.location.href = '/tournoi';
};
/** Envoyer un match vers l'écran de jeu classique */
let tournoiGoToMatch = (st, m) => {
    let info = Object.assign({}, st.gameInfos, {
        player1: st.players[m.p1].name,
        player2: st.players[m.p2].name,
        start: new Date()
    });
    sessionStorage.setItem("dataGame", JSON.stringify(info));
    sessionStorage.setItem("tournament", "1");
    localStorage.removeItem("savedGame");
    suppressUnload = true;
    window.location.href = '/badminton';
};
/** Afficher la configuration / masquer le tableau */
let tournoiShowConfig = () => {
    $("#tournoi-config").show();
    $("#tournoi-board").hide();
    tournoiUpdateFinalOptions();
};
/** Afficher le tableau / masquer la configuration */
let tournoiShowBoard = () => {
    $("#tournoi-config").hide();
    $("#tournoi-board").show();
};
/** Une ligne de match dans le tableau */
let tournoiMatchLine = (st, m, current) => {
    let n1 = st.players[m.p1].name;
    let n2 = st.players[m.p2].name;
    let res;
    if (m.winner === null)
        res = current ? " <span class=\"vs now\">en cours</span> " : " <span class=\"vs\">vs</span> ";
    else if (typeof m.s1 === "number" && typeof m.s2 === "number")
        res = " <span class=\"vs\">" + m.s1 + " - " + m.s2 + "</span> ";
    else
        res = " <span class=\"vs\">→</span> ";
    let c1 = m.winner === m.p1 ? "win" : (m.winner === m.p2 ? "lose" : "");
    let c2 = m.winner === m.p2 ? "win" : (m.winner === m.p1 ? "lose" : "");
    return `<div class="t-match${current ? " current" : ""}">`
        + `<span class="${c1}">${n1}</span>${res}<span class="${c2}">${n2}</span></div>`;
};
/** Construire le HTML du tableau de tournoi */
let tournoiRenderBoard = (st) => {
    let html = "";
    if (st.champion !== null) {
        html += `<div class="t-champion">🏆 Champion : ${st.champion}</div>`;
    }
    // Poule
    let poule = st.matches.filter(m => m.phase === "Poule");
    if (poule.length > 0) {
        html += `<div class="t-section"><h2>Poule</h2>`;
        st.matches.forEach((m, i) => {
            if (m.phase === "Poule")
                html += tournoiMatchLine(st, m, i === st.cursor && st.stage === "poule");
        });
        html += `</div>`;
    }
    // Classement
    let order = st.players.map((_, i) => i).sort((a, b) => st.players[b].wins - st.players[a].wins);
    html += `<div class="t-section"><h2>Classement</h2>`;
    order.forEach((i, rank) => {
        html += `<div class="t-rank"><span class="pos">${rank + 1}</span> ${st.players[i].name}`
            + ` <span class="wl">${st.players[i].wins} V / ${st.players[i].losses} D</span></div>`;
    });
    html += `</div>`;
    // Barrage
    let barrage = st.matches.filter(m => m.phase === "Barrage");
    if (barrage.length > 0) {
        html += `<div class="t-section"><h2>Barrage</h2>`;
        st.matches.forEach((m, i) => {
            if (m.phase === "Barrage")
                html += tournoiMatchLine(st, m, i === st.cursor && st.stage === "barrage");
        });
        html += `</div>`;
    }
    // Phase finale : une colonne par tour, dans l'ordre d'apparition
    let phases = [];
    st.matches.forEach(m => {
        if (m.phase !== "Poule" && m.phase !== "Barrage" && phases.indexOf(m.phase) === -1)
            phases.push(m.phase);
    });
    if (phases.length > 0) {
        html += `<div class="t-section"><h2>Phase finale</h2><div class="t-bracket">`;
        phases.forEach(ph => {
            html += `<div class="t-round"><h3>${ph}</h3>`;
            st.matches.forEach((m, i) => {
                if (m.phase === ph)
                    html += tournoiMatchLine(st, m, i === st.cursor && st.stage === "final");
            });
            html += `</div>`;
        });
        html += `</div></div>`;
    }
    $("#tournoi-board-content").html(html);
    // Boutons selon l'état (le PDF n'apparaît qu'une fois le tournoi terminé)
    if (st.stage === "done") {
        $("#tournoi-go").hide();
        $("#tournoi-pdf").show();
    }
    else {
        $("#tournoi-go").show().text(st.started ? "REPRENDRE" : "DÉMARRER LE TOURNOI");
        $("#tournoi-pdf").hide();
    }
};
/** Ouvrir le PDF récapitulatif du tournoi */
let downloadTournoiPDF = () => {
    window.open('/pdfTournoi', '_blank');
};
/** Avancer au prochain match : annonce, courte pause d'affichage, puis lancement */
let tournoiAdvanceAndGo = (st) => {
    if (!st.started)
        st.started = true;
    let next = tournoiEnsureNext(st);
    tournoiSave(st);
    tournoiRenderBoard(st);
    if (next === null) {
        speak("Le tournoi est terminé. Champion : " + st.champion);
        return;
    }
    let a = st.players[next.p1].name;
    let b = st.players[next.p2].name;
    $("#tournoi-next").text(next.phase + " — " + a + " contre " + b);
    speak(next.phase + ". Prochain match : " + a + " contre " + b);
    setTimeout(() => tournoiGoToMatch(st, next), 4000);
};
/** Bouton Démarrer / Reprendre */
let tournoiStartOrResume = () => {
    let st = tournoiLoad();
    if (st !== null)
        tournoiAdvanceAndGo(st);
};
/** Bouton Nouveau tournoi */
let tournoiNew = () => {
    if (!confirm("Démarrer un nouveau tournoi ? Le tournoi en cours sera perdu."))
        return;
    localStorage.removeItem("savedTournament");
    sessionStorage.removeItem("tournoiAuto");
    window.location.href = '/tournoi';
};
/** Ajouter un champ joueur */
let tournoiAddPlayer = () => {
    let n = $(".tournoi-player").length + 1;
    $("#players-list").append(`<div class="row-infos player-row">`
        + `<input type="text" class="tournoi-player" placeholder="Joueur ${n}">`
        + `<button type="button" class="rm-player" onclick="tournoiRemovePlayer(this)">🗑️</button>`
        + `</div>`);
    tournoiUpdateFinalOptions();
};
/** Supprimer un champ joueur (en gardant au moins 2 champs) */
let tournoiRemovePlayer = (btn) => {
    if ($(".tournoi-player").length <= 2)
        return;
    $(btn).closest(".player-row").remove();
    tournoiUpdateFinalOptions();
};
/** Mettre à jour les tailles de phase finale proposées selon le nombre de joueurs */
let tournoiUpdateFinalOptions = () => {
    let nb = $(".tournoi-player").length;
    let sizes = tournoiFinalSizes(nb);
    let prev = $("#finalPhase").val();
    let opts = sizes.map(s => `<option value="${s}">${tournoiPhaseLabel(s)}</option>`).join("");
    $("#finalPhase").html(opts);
    if (prev !== null && sizes.indexOf(Number(prev)) !== -1)
        $("#finalPhase").val(prev);
};
/** Créer le tournoi à partir du formulaire */
let tournoiCreate = () => {
    let names = [];
    $(".tournoi-player").each((i, el) => {
        let v = $(el).val().trim();
        names.push(v.length > 0 ? v : "Joueur " + (i + 1));
    });
    if (names.length < 2) {
        alert("Ajoutez au moins 2 joueurs.");
        return;
    }
    let poolCount = Number($("#nbMatchsPoule").val());
    if (!(poolCount >= 1))
        poolCount = 1;
    let finalSize = Number($("#finalPhase").val());
    let gameInfos = {
        player1: "",
        player2: "",
        sets: (Number($("#nbSets").val()) > 0 ? Number($("#nbSets").val()) : 2),
        set: (Number($("#nbJSets").val()) > 0 ? Number($("#nbJSets").val()) : 6),
        points: (Number($("#nbPoints").val()) > 0 ? Number($("#nbPoints").val()) : 20),
        training: $("#training").is(":checked"),
        timeTrain: (Number($("#timeTrain").val()) >= 0 ? Number($("#timeTrain").val()) : 40),
        pauseStart: (Number($("#pauseStart").val()) >= 0 ? Number($("#pauseStart").val()) : 30),
        pauseSet: (Number($("#pauseSet").val()) >= 0 ? Number($("#pauseSet").val()) : 45),
        pauseGame: (Number($("#pauseGame").val()) >= 0 ? Number($("#pauseGame").val()) : 60),
        start: new Date()
    };
    let players = names.map(n => ({ name: n, wins: 0, losses: 0 }));
    let st = {
        gameInfos: gameInfos,
        players: players,
        poolCount: poolCount,
        finalSize: finalSize,
        matches: tournoiBuildPoule(players.length, poolCount),
        cursor: 0,
        stage: "poule",
        started: false,
        roundPlayers: [],
        barrageGroup: [],
        barrageSpots: 0,
        qualified: [],
        champion: null
    };
    tournoiSave(st);
    tournoiRenderBoard(st);
    tournoiShowBoard();
};
/** Point d'entrée de la page /tournoi */
let tournoiInit = () => {
    let st = tournoiLoad();
    if (st === null) {
        tournoiShowConfig();
        return;
    }
    tournoiRenderBoard(st);
    tournoiShowBoard();
    // Retour automatique après un match : on enchaîne
    if (sessionStorage.getItem("tournoiAuto") === "1") {
        sessionStorage.removeItem("tournoiAuto");
        tournoiAdvanceAndGo(st);
    }
};
/********* EVENTS *********/
window.addEventListener('beforeunload', (event) => {
    if (suppressUnload || !matchInProgress)
        return;
    const confirmationMessage = 'Êtes-vous sûr de vouloir quitter ou recharger la page ?';
    event.returnValue = confirmationMessage;
    return confirmationMessage;
});
