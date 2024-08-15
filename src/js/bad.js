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
/********* METHODES *********/
/**
 * Début du jeu lors du click sur le bouton
 */
var clickBtn = () => {
    if (confirm('Démarrer la partie ?')) {
        let player1 = $("#player1").val();
        let player2 = $("#player2").val();
        let sets = $("#nbSets").val();
        let points = $("#nbPoints").val();
        // Objet de partie
        let obj = {
            player1: (player1.length > 0 ? player1 : "Joueur 1"),
            palyer2: (player2.length > 0 ? player2 : "Joueur 2"),
            sets: (sets > 0 ? sets : 2),
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
let game;
/** HISTORIQUE DES SETS */
let logsSets = [];
let startGame = () => {
    let dataGame = sessionStorage.getItem("dataGame");
    if (dataGame === null)
        window.location.href = '/';
    let obj = JSON.parse(dataGame);
    game = new Badminton(obj);
};
let clickScore = (player) => {
    if (game === undefined)
        return;
    game.newPoint(player);
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
        this.player2 = new BadmintonPlayer(gameInfos.palyer2, gameInfos.sets, gameInfos.points);
        this.service = null;
        this.timeStart = 0;
        this.timeSets = 0;
        this.timePoints = 0;
        this.gameEnd = false;
        this.inGame = false;
        this.chronoSet = null;
        this.chronoPoint = null;
        // On démarre le jeu
        this.start();
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
            yield this.break(30);
            this.playSong();
            // Debut du jeu avec entrainement
            yield this.train();
            this.setInfoTxt("Début du jeu");
            // On démarre le jeu avec un nouveau set
            this.inGame = true;
            this.newSet(true);
            this.startTimer();
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
            if (time === undefined)
                time = 5;
            this.setInfoTxt("Pause de " + time + " secondes");
            let inT = setInterval(() => {
                // @ts-ignore
                time--;
                // @ts-ignore
                this.setInfoTxt("Pause de " + time + " seconde" + (time > 1 ? "s" : ""));
            }, 1000);
            yield sleep(time * 1000);
            clearInterval(inT);
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
            let time = 100;
            this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " secondes");
            let inT = setInterval(() => {
                // @ts-ignore
                time--;
                this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " seconde" + (time > 1 ? "s" : ""));
            }, 1000);
            yield sleep(time * 1000);
            this.playSong();
            clearInterval(inT);
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
                return;
            }
            let p1 = this.player1.getSet();
            let p2 = this.player2.getSet();
            if ((p1 >= 6 && Math.abs(p1 - p2) >= 2) || (p2 >= 6 && Math.abs(p2 - p1) >= 2)) {
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
                    $(".gam-p2").remove();
                    $(".gam-p1").remove();
                    $(".set-p" + win).removeClass("set-p" + win).addClass("s-win");
                    $(".set-p" + lose).removeClass("set-p" + lose).addClass("s-lose");
                    yield sleep(2000);
                    this.gameEnd = true;
                    this.inGame = false;
                    return;
                }
                else {
                    this.setInfoTxt("Le joueur " + winPlayer.getNomJoueur() + " a gagné le jeu !");
                    $(".gam-p2").remove();
                    $(".gam-p1").remove();
                    $(".set-p" + win).removeClass("set-p" + win).addClass("s-win");
                    $(".set-p" + lose).removeClass("set-p" + lose).addClass("s-lose");
                    yield sleep(2000);
                    this.player1.resetSets();
                    this.player2.resetSets();
                    this.player1.resetPoint();
                    this.player2.resetPoint();
                    yield this.break(120);
                    this.playSong();
                    this.setInfoTxt("Début du jeu " + (this.player2.getScore() + this.player1.getScore() + 1));
                    yield sleep(2000);
                    yield this.train();
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
                yield this.break(120);
                this.playSong();
                this.setInfoTxt("Début du set " + (p1 + p2 + 1));
                yield sleep(2000);
                this.timeSets = 0;
                this.timePoints = 0;
                yield this.train();
                this.setInfoTxt("Début");
                this.toggleTimerSet();
                this.toggleTimerPoint();
                this.inGame = true;
            }
        });
    }
    /**
     * Lorsque le joueur marque un nouveau point
     * @param {number} player Numéro du joueur
     */
    newPoint(player) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.inGame)
                return;
            let playerN = (player === 1 ? this.player1 : this.player2);
            let otherPlayer = (player === 1 ? this.player2 : this.player1);
            console.log("Nouveau point pour " + playerN.getNomJoueur());
            console.log("Score : " + playerN.getPoint());
            console.log("Score : " + otherPlayer.getPoint());
            if (playerN.getPoint() + 1 >= this.gameInfos.points && Math.abs(playerN.getPoint() + 1 - otherPlayer.getPoint()) >= 2) {
                this.setInfoTxt("Fin du set pour " + playerN.getNomJoueur());
                let logedSet = {
                    j1: this.player1.getPoint(),
                    j2: this.player2.getPoint(),
                    time: this.timeSets
                };
                logsSets.push(logedSet);
                playerN.addSet();
                this.newSet();
            }
            else {
                this.inGame = false;
                playerN.addPoint();
                let scoreP1 = this.player1.getPoint();
                let scoreP2 = this.player2.getPoint();
                $(".gam-p1 p").text(scoreP1);
                $(".gam-p2 p").text(scoreP2);
                this.toggleService();
                yield sleep(2000);
                let txtBalle = "set";
                if (this.balleDeJeu(playerN, otherPlayer))
                    txtBalle = "jeu";
                if (this.balleDeMatch(playerN, otherPlayer))
                    txtBalle = "match";
                if (playerN.getPoint() == this.gameInfos.points - 1 && Math.abs(playerN.getPoint() - otherPlayer.getPoint()) > 1) {
                    this.setInfoTxt("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());
                    this.importantPoint();
                }
                else if (playerN.getPoint() >= this.gameInfos.points - 1 && Math.abs(playerN.getPoint() - otherPlayer.getPoint()) == 1) {
                    this.setInfoTxt("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());
                    this.importantPoint();
                }
                this.timePoints = 0;
                this.inGame = true;
            }
        });
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
        }
        else {
            $("#joueur2").append('<img class="serve-l" src="icon/vol.svg" alt="Service" />');
        }
        this.setInfoTxt(this.service.getNomJoueur() + " sert");
    }
    /**
     * Permet de joueur le signal sonore de début ou fin
     * @private
     */
    playSong() {
        // Jouer le fichier other/start.mp3
        let audio = new Audio('other/start.mp3');
        audio.play();
    }
    /**
     * Jouer le signal lorsqu'il s'agit d'un point important
     * @private
     */
    importantPoint() {
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
        return p1 + 1 >= 6 && p1 - p2 >= 1;
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
}
/********* EVENTS *********/
window.addEventListener('beforeunload', (event) => {
    const confirmationMessage = 'Êtes-vous sûr de vouloir quitter ou recharger la page ?';
    event.returnValue = confirmationMessage;
    return confirmationMessage;
});
