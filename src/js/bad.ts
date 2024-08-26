/*
 * Copyright (c) 2024. SCORE SMASH
 * ScoreSmash - Développé par Joey CAZO
 * License : Apache-2.0, Août 2024
 */

/********* DÉPENDANCES *********/

/********* INTERFACES *********/

// @ts-ignore
var dev : boolean = false; // TODO : Changer

/** Informations envoyés lors du démarrage de la partie */
interface dataSendInfoStart {
    player1     : string,
    player2     : string,
    sets        : number, // Nombre de jeux pour gagner le match
    set         : number, // Nombre de sets pour gagner le jeu
    points      : number, // Nombre de points pour gagner le set
    start       : Date
}

/** Informations du match pour créer le PDF */
interface dataLogMatch {
    winner      : string,
    time        : number,
    numberSet   : number,
    gamesList   : dataLogJeu[]
}

/** Information envoyés à la fin d'un jeu */
interface dataLogJeu {
    player1     : number,
    player2     : number,
    time        : number,
    setsList    : dataLogSet[]
}

/** Informations envoyés lors de la fin d'un set */
interface dataLogSet {
    j1   : number,
    j2   : number;
    time : number
}


/********* METHODES *********/

/**
 * Début du jeu lors du click sur le bouton
 */
var clickBtn = () : void => {

    if (confirm('Démarrer la partie ?')) {

        let player1 : string = $("#player1").val()   as string;
        let player2 : string = $("#player2").val()   as string;
        let sets    : number = $("#nbSets").val()    as number;
        let set     : number = $("#nbJSets").val()   as number;
        let points  : number = $("#nbPoints").val()  as number;

        // Objet de partie
        let obj : dataSendInfoStart = {
            player1 : (player1.length > 0 ? player1 : "Joueur 1"),
            player2 : (player2.length > 0 ? player2 : "Joueur 2"),
            sets    : (sets           > 0 ? sets    : 2)         ,
            set     : (set            > 0 ? set     : 6)         ,
            points  : (points         > 0 ? points  : 20)        ,
            start   : new Date()
        }

        // Envoi des informations
        sessionStorage.setItem("dataGame", JSON.stringify(obj));

        // Changement de page
        window.location.href = '/badminton';
    }

}

/** JEU */
let game : Badminton;

let startGame = () => {

    let dataGame = sessionStorage.getItem("dataGame") as string;

    if (dataGame === null) window.location.href = '/';

    let obj = JSON.parse(dataGame) as dataSendInfoStart;

    game = new Badminton( obj );

}

var randomUID = (taille = 20) => {
    var uid = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < taille; i++) {
        uid += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return uid;
}

let clickScore = ( player : number ) : void => {

    if (game === undefined) return;

    game.newPoint( player );

}

let startMatch = () => {
    game.start();
    $("button.go").hide();
}

function sleep(ms : number) : Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Seconde vers HH:mm:ss
 * @param {number} secondes
 * @return {string}
 */
var formatTime = (secondes: number): string  => {
    const heures = Math.floor(secondes / 3600);
    const minutes = Math.floor((secondes % 3600) / 60);
    const secs = secondes % 60;

    const formattedHours = String(heures).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}


/********* CLASSES *********/

/**
 * Classe du jeu de badminton permettant de gérer les actions et les joueurs
 * @class Badminton
 * @since 1.0
 * @version 1.0
 * @author Joey CAZO
 */
class Badminton {

    /** Objet contenant les informations du jeu */
    private gameInfos   : dataSendInfoStart;
    /** Joueur 1 */
    private player1     : BadmintonPlayer;
    /** Joueur 2 */
    private player2     : BadmintonPlayer;
    /** Joueur qui sert */
    private service     : BadmintonPlayer | null;
    /** Dernier joueur à avoir marqué un point */
    private lastPlayerWon : BadmintonPlayer | null;
    /** Série de point gagné par le joueur */
    private numberPoint   : number;

    /** Temps de début de la partie */
    private timeStart   : number;
    /** Durée du set */
    private timeSets    : number;
    /** Durée du point */
    private timePoints  : number;

    /** Fin de la partie */
    private gameEnd     : boolean;
    /** Permet de savoir si le jeu est en cours (Pause, ...) */
    private inGame      : boolean;

    /** Interval du chrono de set */
    private chronoSet   : any;
    /** Interval du chrono de point */
    private chronoPoint : any;
    /** ID de la room du socket */
    private roomId : string;

    /** Historique des jeux */
    private logsGames : dataLogJeu[];
    /** Historique des sets */
    private logsSets  : dataLogSet[];
    /** Données du match */
    private logMatch : dataLogMatch;
    /** Nombre de sets */
    private numSets : number;


    constructor ( gameInfos : dataSendInfoStart) {

        this.gameInfos = gameInfos;

        this.gameInfos.sets = Number(this.gameInfos.sets);

        this.player1 = new BadmintonPlayer( gameInfos.player1, gameInfos.sets, gameInfos.points );
        this.player2 = new BadmintonPlayer( gameInfos.player2, gameInfos.sets, gameInfos.points );
        this.service = null;
        this.lastPlayerWon = null;
        this.numberPoint = 0;

        this.timeStart = 0;
        this.timeSets = 0;
        this.timePoints = 0;

        this.gameEnd = false;
        this.inGame  = false;

        this.chronoSet = null;
        this.chronoPoint = null;
        this.roomId = !dev ? randomUID(5) : "dev";

        this.logsGames = [];
        this.logsSets  = [];
        this.logMatch = {
            winner      : "",
            time        : 0,
            numberSet   : 0,
            gamesList   : []
        }
        this.numSets = 0;

        $("button.go").show();

    }

    /**
     * Démarrer le jeu
     * @private
     */
    public async start() : Promise<void> {

        console.log("Démarrage du jeu");

        let dataFinMatch : dataLogMatch = {
            winner      : "Joey",
            time        : 1541,
            numberSet   : 21,
            gamesList   : [
                {
                    player1 : 1,
                    player2 : 0,
                    time    : 120,
                    setsList : [
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 17,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 14,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 7,
                            j2   : 20,
                            time : 245
                        },
                        {
                            j1   : 20,
                            j2   : 4,
                            time : 60
                        },
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 197
                        },
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 10,
                            j2   : 20,
                            time : 128
                        },
                        {
                            j1   : 24,
                            j2   : 26,
                            time : 60
                        },
                        {
                            j1   : 20,
                            j2   : 12,
                            time : 148
                        },
                        {
                            j1   : 26,
                            j2   : 24,
                            time : 60
                        }
                    ]
                },
                {
                    player1 : 1,
                    player2 : 1,
                    time    : 245,
                    setsList : [
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 17,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 14,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 7,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 20,
                            j2   : 4,
                            time : 60
                        },
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 10,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 24,
                            j2   : 26,
                            time : 60
                        }
                    ]
                },
                {
                    player1 : 2,
                    player2 : 1,
                    time    : 245,
                    setsList : [
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 17,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 14,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 7,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 20,
                            j2   : 4,
                            time : 60
                        },
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 21,
                            j2   : 19,
                            time : 60
                        },
                        {
                            j1   : 10,
                            j2   : 20,
                            time : 60
                        },
                        {
                            j1   : 24,
                            j2   : 26,
                            time : 60
                        }
                    ]
                }
            ]
        }

        // Affichage des informations
        $("#joueur1 p").text( this.player1.getNomJoueur() );
        $("#joueur2 p").text( this.player2.getNomJoueur() );

        // Choix du joueur qui sert en premier
        let rand = Math.floor(Math.random() * 2);
        if (rand === 0) this.service = this.player2;
        else            this.service = this.player1;

        this.service.toogleServe();

        await sleep(2000);

        this.toggleService();

        await sleep(2000);

        // Temporisation pour le début de la partie
        await this.break(!dev ? 30 : 2);

        this.playSong();

        // Debut du jeu avec entrainement

        await this.train();

        this.setInfoTxt("Début du jeu");
        this.talk("Début du jeu");
        this.talk(this.service.getNomJoueur() + " commence à servir");

        // On démarre le jeu avec un nouveau set
        this.inGame = true;

        this.newSet(true);

        this.startTimer();

        this.numSets++;

    }

    /**
     * Permet de faire les pauses
     * @param {number} time Temps de pause (En secondes)
     * @private
     */
    private async break( time? : number) : Promise<void> {

        this.inGame = false;

        if (time === undefined) time = 5;

        this.setInfoTxt("Pause de " + time + " secondes");

        let inT = setInterval(() => {

            // @ts-ignore
            time--;
            // @ts-ignore
            this.setInfoTxt("Pause de " + time + " seconde" + (time > 1 ? "s" : ""));

        }, 1000)

        await sleep(time * 1000);

        this.talk("Fin de la pause");

        clearInterval(inT);

    }

    /**
     * Pause pour l'entrainement avant le match
     * @return {Promise<void>}
     * @private
     */
    private async train () : Promise<void> {

        this.inGame = false;

        this.talk("Échauffement de 40 secondes")

        let time : number = !dev ? 40 : 2;

        this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " secondes");

        let inT = setInterval(() => {

            // @ts-ignore
            time--;
            this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " seconde" + (time > 1 ? "s" : ""));

        }, 1000)

        await sleep(time * 1000);

        this.playSong();

        this.talk("Début du point")

        clearInterval(inT);

    }

    /**
     * Démarrer le chronomètre de partie
     */
    private startTimer() : void {

        let chrono = setInterval(() => {

            if (!this.inGame || this.gameEnd) return;

            this.timeStart++;
            $("#totalTime").text( formatTime(this.timeStart) );

        }, 1000)

    }

    /**
     * Permet de démarrer ou éteindre le chronomètre de set
     * @private
     */
    private toggleTimerSet() : void {

        if (this.chronoSet === null) {

            this.chronoSet = setInterval(() => {

                this.timeSets++;
                $("#setsTime").text( formatTime(this.timeSets) );

            }, 1000);

        } else {

            clearInterval(this.chronoSet);
            this.chronoSet = null;
            this.timeSets = 0;

        }

    }

    /**
     * Permet de démarrer ou éteindre le chronomètre de points
     * @private
     */
    private toggleTimerPoint() : void {

        if (this.chronoPoint === null) {

            this.chronoPoint = setInterval(() => {

                this.timePoints++;
                $("#pointTime").text( formatTime(this.timePoints) );

            }, 1000);

        } else {

            clearInterval(this.chronoPoint);
            this.chronoPoint = null;
            this.timePoints = 0;

        }

    }

    /**
     * Permet de démarrer un nouveau set
     * @private
     */
    private async newSet ( init : boolean = false ) : Promise<void> {

        // Initialiser un nouveau set lors d'un nouveau jeu
        if (init) {

            this.timeSets = 0;

            this.toggleTimerSet();

            let htmlPla1 : string = `
            <div class="set set-p1">
    
                <p>${this.player1.getSet()}</p>
    
            </div>
    
            <div class="game gam-p1">
    
                <p>0</p>
    
            </div>
            `;

            let htmlPla2 : string = `
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


        let p1 : number = this.player1.getSet();
        let p2 : number = this.player2.getSet();

        if ((p1 >= this.gameInfos.set && Math.abs(p1 - p2) >= 2) || (p2 >= this.gameInfos.set && Math.abs(p2 - p1) >= 2)) {

            this.inGame = false;

            this.toggleTimerSet  ();
            this.toggleTimerPoint();

            let win : number  = p1 > p2 ? 1 : 2;
            let lose : number = win === 1 ? 2 : 1;
            let winPlayer : BadmintonPlayer = (win === 1 ? this.player1 : this.player2);
            let losePlayer : BadmintonPlayer = (win === 1 ? this.player2 : this.player1);

            $(".set-p" + win + " p") .text(winPlayer.getSet());
            $(".set-p" + lose + " p").text(losePlayer.getSet());

            winPlayer.addScore();

            if (winPlayer.getScore() === this.gameInfos.sets) {

                this.setInfoTxt("Le joueur " + winPlayer.getNomJoueur() + " a gagné le match !");
                this.talk("Le joueur " + winPlayer.getNomJoueur() + " a gagné le match !");

                let newGameLog : dataLogJeu = {
                    player1 : this.player1.getScore(),
                    player2 : this.player2.getScore(),
                    time    : this.timeSets,
                    setsList: this.logsSets
                }

                this.logsGames.push(newGameLog);

                this.logMatch.gamesList = this.logsGames;
                this.logMatch.numberSet = this.numSets - 1;
                this.logMatch.time      = this.timeStart;
                this.logMatch.winner    = winPlayer.getNomJoueur();




                $(".gam-p2").remove();
                $(".gam-p1").remove();

                $(".set-p" + win) .removeClass("set-p" + win ).addClass("s-win");
                $(".set-p" + lose).removeClass("set-p" + lose).addClass("s-lose");

                await sleep(2000);

                this.gameEnd = true;
                this.inGame = false;

                this.printPDFMatch();

                return;

            } else {

                this.setInfoTxt("Le joueur " + winPlayer.getNomJoueur() + " a gagné le jeu !");
                this.talk("Le joueur " + winPlayer.getNomJoueur() + " a gagné le jeu !");

                let newGameLog : dataLogJeu = {
                    player1 : this.player1.getScore(),
                    player2 : this.player2.getScore(),
                    time    : this.timeSets,
                    setsList: this.logsSets
                }

                this.logsGames.push(newGameLog);

                this.logsSets = [];

                $(".gam-p2").remove();
                $(".gam-p1").remove();

                $(".set-p" + win) .removeClass("set-p" + win ).addClass("s-win");
                $(".set-p" + lose).removeClass("set-p" + lose).addClass("s-lose");

                await sleep(2000);

                this.player1.resetSets();
                this.player2.resetSets();

                this.player1.resetPoint();
                this.player2.resetPoint();

                await this.break(dev ? 3 : 60);

                this.playSong();

                this.setInfoTxt("Début du jeu " + (this.player2.getScore() + this.player1.getScore() + 1));

                this.talk("Début du jeu " + (this.player2.getScore() + this.player1.getScore() + 1));
                this.talk(this.service?.getNomJoueur() + " sert");

                await sleep(2000);

                await this.train();

                this.newSet(true);

            }


        } else {


            this.toggleTimerSet  ();
            this.toggleTimerPoint();

            $(".set-p1 p").text(p1);
            $(".set-p2 p").text(p2);

            this.player1.resetPoint();
            this.player2.resetPoint();

            $(".gam-p1 p").text("0");
            $(".gam-p2 p").text("0");

            await this.break(!dev ? 45 : 2);

            this.playSong();

            this.setInfoTxt("Début du set " + this.numSets);
            this.talk("Début du set " + this.numSets);

            await sleep(2000);

            this.timeSets   = 0;
            this.timePoints = 0;

            await this.train();

            this.setInfoTxt("Début");
            if (this.service !== null) this.talk(this.service.getNomJoueur() + " sert");

            this.toggleTimerSet();
            this.toggleTimerPoint();

            this.inGame = true;


        }


    }

    /**
     * Lorsque le joueur marque un nouveau point
     * @param {number} player Numéro du joueur
     */
    public async newPoint( player : number ) : Promise<void> {

        if (!this.inGame) return;

        let playerN     : BadmintonPlayer = (player === 1 ? this.player1 : this.player2);
        let otherPlayer : BadmintonPlayer = (player === 1 ? this.player2 : this.player1);

        if (playerN.getPoint() + 1 >= this.gameInfos.points && Math.abs(playerN.getPoint() + 1 - otherPlayer.getPoint()) >= 2) {

            this.setInfoTxt("Fin du set pour " + playerN.getNomJoueur());
            this.talk("Fin du set pour " + playerN.getNomJoueur());

            let logedSet : dataLogSet = {
                j1   : this.player1.getPoint(),
                j2   : this.player2.getPoint(),
                time : this.timeSets
            }

            this.logsSets.push(logedSet);
            this.numSets++;

            playerN.addSet();

            $(".grid-all-points").html('');

            let playerLead : BadmintonPlayer = (playerN.getSet() > otherPlayer.getSet() ? playerN : otherPlayer);
            let playerLose : BadmintonPlayer = (playerN.getSet() > otherPlayer.getSet() ? otherPlayer : playerN);

            this.talk(playerLead.getNomJoueur() + " mène " + playerLead.getSet() + " sets à " + playerLose.getSet());

            this.newSet();

        } else {
            this.inGame = false;

            playerN.addPoint();

            this.talk("Point pour " + playerN.getNomJoueur());
            this.talk(playerN.getPoint() + " à " + otherPlayer.getPoint() + " pour " + playerN.getNomJoueur());

            let txtPoint : string;

            if (player === 1) {
                txtPoint = `<div class="item">

                    <div class="winner">${playerN.getPoint()}</div>
                    <div class="looser"></div>
        
                </div>`
            } else {
                txtPoint = `<div class="item">

                    <div class="looser"></div>
                    <div class="winner">${playerN.getPoint()}</div>
        
                </div>`
            }

            if (this.lastPlayerWon !== null && this.lastPlayerWon === playerN) {

                this.numberPoint++;

                if (this.numberPoint >= 4) {
                    this.talk(this.numberPoint + 1 + " points consécutifs pour " + playerN.getNomJoueur());
                }

                this.talk(this.service?.getNomJoueur() + " sert");

            } else {
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

            await sleep(2000);

            let txtBalle = "set";
            if (this.balleDeJeu  (playerN, otherPlayer)) txtBalle = "jeu"  ;
            if (this.balleDeMatch(playerN, otherPlayer)) txtBalle = "match";

            if (playerN.getPoint() == this.gameInfos.points - 1 && Math.abs(playerN.getPoint() - otherPlayer.getPoint()) > 1)
            {
                this.setInfoTxt("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());
                this.importantPoint();
                this.talk("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());

            } else if (playerN.getPoint() >= this.gameInfos.points - 1 && Math.abs(playerN.getPoint() - otherPlayer.getPoint()) == 1) {

                this.setInfoTxt("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());
                this.importantPoint();
                this.talk("Balle de " + txtBalle + " pour " + playerN.getNomJoueur());

            }

            this.timePoints = 0;

            this.inGame = true;

        }

    }

    /**
     * Enoncer le texte
     * @param {string} text
     * @private
     */
    private talk ( text : string ) : void {

        if (dev) return;

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
        } else {
            alert('NON DISPO');
        }

    }

    /**
     * Modifier le texte d'information
     * @param {string} text Texte à afficher (Optionnel pour laisser vide)
     * @private
     */
    private setInfoTxt ( text? : string ) : void {

        if (text === undefined) $("#info_txt").html('');
        else                    $("#info_txt").html(text);

    }

    /**
     * Permet de changer le service et l'indicateur
     * @private
     */
    private toggleService () : void {

        if (this.service === null) return;

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
        } else {
            $("#joueur2").append('<img class="serve-l" src="icon/vol.svg" alt="Service" />');
            this.talk(this.player2.getNomJoueur() + " sert");
        }

        this.setInfoTxt( this.service.getNomJoueur() + " sert" );


    }

    /**
     * Permet de joueur le signal sonore de début ou fin
     * @private
     */
    private playSong() : void {

        if (dev) return;

        // Jouer le fichier other/start.mp3
        let audio = new Audio('other/start.mp3');

        audio.play();


    }

    /**
     * Jouer le signal lorsqu'il s'agit d'un point important
     * @private
     */
    private importantPoint() : void {

        if (dev) return;

        let audio = new Audio('other/horn.mp3');

        audio.play();

    }

    /**
     * Retourne si il s'agit d'une balle de jeu
     * @return {boolean}
     * @private
     */
    private balleDeJeu( playPoint : BadmintonPlayer, otherPlay : BadmintonPlayer ) : boolean {

        let p1 : number = playPoint.getSet();
        let p2 : number = otherPlay.getSet();

        return p1 + 1 >= this.gameInfos.set && p1 - p2 >= 1;

    }

    /**
     * Retourne si il s'agit d'une balle de match
     * @return {boolean}
     * @private
     */
    private balleDeMatch( playPoint : BadmintonPlayer, otherPlay : BadmintonPlayer) : boolean {

        let p1 : number = playPoint.getScore();

        console.log(p1);
        console.log(this.gameInfos.sets as number);

        console.log(typeof p1);
        console.log(typeof this.gameInfos.sets);

        console.log(this.balleDeJeu(playPoint, otherPlay));
        console.log(p1+1 === this.gameInfos.sets as number)

        return this.balleDeJeu(playPoint, otherPlay) && p1+1 === this.gameInfos.sets as number;

    }

    /**
     * Récupérer les informations du match à la fin du match
     * @return {dataLogMatch | null} Informations du match ou null si le match n'est pas terminé
     */
    public getMatchInfos () : dataLogMatch | null {

        if (!this.gameEnd) return null;

        return this.logMatch;

    }

    private printPDFMatch (dataToPrint? : dataLogMatch) : void {

        localStorage.setItem("dataMatch", JSON.stringify(dataToPrint === undefined ? this.logMatch : dataToPrint));

        window.open('/pdfBad', '_blank');

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

    /** Nom du joueur */
    private nomJoueur   : string;
    /** Nombre de jeu du joueur */
    private score       : number;
    /** Nombre de sets du joueur */
    private sets        : number;
    /** Nombre de points du joueur */
    private points      : number;
    /** Si le joueur sert */
    private serve       : boolean;

    /** Nombre de sets pour gagner */
    private maxSet      : number;
    /** Nombre de points pour gagner */
    private maxPoints   : number;

    constructor( nomJoueur : string, sets : number, points : number ) {

        this.nomJoueur  = nomJoueur;
        this.score      = 0;
        this.sets       = 0;
        this.points     = 0;
        this.serve      = false;

        this.maxSet     = sets;
        this.maxPoints  = points;

    }

    /**
     * Ajouter un point au joueur
     */
    public addPoint() : void {

        this.points++;

    }

    /**
     * Ajouter un set au joueur
     */
    public addSet() : void {

        this.points = 0;
        this.sets++;

    }

    /**
     * Ajouter un jeu au joueur
     */
    public addScore() : void {

        this.score++;
        this.points = 0;
        this.sets = 0;

    }

    /** Récupérer le nombre de points pour le jeu en cours */
    public getPoint() : number { return this.points; }

    /** Récupérer le nombre de sets pour le jeu en cours */
    public getSet () : number { return this.sets; }

    /** Récupérer le nombre de jeux pour le jeu en cours */
    public getScore() : number { return this.score; }

    /**
     * Permet de forcer le nombre de set (Pour les tests)
     * @param {number} set
     */
    public setSets ( set : number ) : void {
        this.sets = set;
    }

    /**
     * Permet de forcer le nombre de points (Pour les tests)
     * @param {number} point
     */
    public setPoints ( point : number ) : void {
        this.points = point;
    }

    /**
     * Permet de récupérer le nom du joueur
     * @return {string} Nom du joueur
     */
    public getNomJoueur() : string { return this.nomJoueur; }

    /**
     * Permet de savoir si le joueur sert
     * @return {boolean} Si le joueur sert
     */
    public getServe() : boolean { return this.serve;}

    /**
     * Changer si le joueur sert ou non
     */
    public toogleServe() : void {
        this.serve = !this.serve;
    }

    /** Permet de réinitialiser les points du joueur */
    public resetPoint() : void {
        this.points = 0;
    }

    /** Permet de réinitialiser les sets du joueur */
    public resetSets() : void {
        this.sets = 0;
    }

}


/********* EVENTS *********/

window.addEventListener('beforeunload', (event) => {
    const confirmationMessage = 'Êtes-vous sûr de vouloir quitter ou recharger la page ?';
    event.returnValue = confirmationMessage;
    return confirmationMessage;
});