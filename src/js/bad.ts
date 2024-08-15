/*
 * Copyright (c) 2024. SCORE SMASH
 * ScoreSmash - Développé par Joey CAZO
 * License : Apache-2.0, Août 2024
 */

/********* DÉPENDANCES *********/

/********* INTERFACES *********/

/** Informations envoyés lors du démarrage de la partie */
interface dataSendInfoStart {
    player1     : string,
    palyer2     : string,
    sets        : number,
    points      : number,
    start       : Date
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
        let points  : number = $("#nbPoints").val()  as number;

        // Objet de partie
        let obj : dataSendInfoStart = {
            player1 : (player1.length > 0 ? player1 : "Joueur 1"),
            palyer2 : (player2.length > 0 ? player2 : "Joueur 2"),
            sets    : (sets           > 0 ? sets    : 2)         ,
            points  : (points         > 0 ? points  : 20)        ,
            start   : new Date()
        }

        // Envoi des informations
        localStorage.setItem("dataGame", JSON.stringify(obj));

        // Changement de page
        window.location.href = '/badminton';
    }

}

let game : Badminton;

let startGame = () => {

    let dataGame = localStorage.getItem("dataGame") as string;

    if (dataGame === null) window.location.href = '/';

    let obj = JSON.parse(dataGame) as dataSendInfoStart;

    game = new Badminton( obj );

}

let clickScore = ( player : number ) : void => {

    if (game === undefined) return;

    game.newPoint( player );

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


    constructor ( gameInfos : dataSendInfoStart ) {

        this.gameInfos = gameInfos;

        this.player1 = new BadmintonPlayer( gameInfos.player1, gameInfos.sets, gameInfos.points );
        this.player2 = new BadmintonPlayer( gameInfos.palyer2, gameInfos.sets, gameInfos.points );
        this.service = null;

        this.timeStart = 0;
        this.timeSets = 0;
        this.timePoints = 0;

        this.gameEnd = false;
        this.inGame  = false;

        this.chronoSet = null;
        this.chronoPoint = null;

        // On démarre le jeu
        this.start();

    }

    /**
     * Démarrer le jeu
     * @private
     */
    private async start() : Promise<void> {

        console.log("Démarrage du jeu");

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
        await this.break(5);   // TODO : Remettre à 25

        this.playSong();

        // Debut du jeu avec entrainement

        await this.train();

        this.setInfoTxt("Début du jeu");

        // On démarre le jeu avec un nouveau set
        this.inGame = true;

        this.newSet()

        this.startTimer();

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
            this.setInfoTxt("Pause de " + time + " secondes");

        }, 1000)

        await sleep(time * 1000);

        clearInterval(inT);

    }

    /**
     * Pause pour l'entrainement avant le match
     * @return {Promise<void>}
     * @private
     */
    private async train () : Promise<void> {

        this.inGame = false;

        let time : number = 10;        // TODO : Remettre à 100

        this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " secondes");

        let inT = setInterval(() => {

            // @ts-ignore
            time--;
            this.setInfoTxt("[ECHAUFFEMENT] Encore " + time + " secondes");

        }, 1000)

        await sleep(time * 1000);

        this.playSong();

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
    private newSet () : void {

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

            playerN.addSet();

            // TODO : Finir les points

            this.newSet();

        } else {

            playerN.addPoint();

            let scoreP1 = this.player1.getPoint();
            let scoreP2 = this.player2.getPoint();

            $(".gam-p1 p").text(scoreP1);
            $(".gam-p2 p").text(scoreP2);

            this.toggleService();

            await sleep(2000);

            if (playerN.getPoint() == this.gameInfos.points - 1)
            {
                this.setInfoTxt("Balle de set pour " + playerN.getNomJoueur());
                this.importantPoint();
            }

            this.timePoints = 0;

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
        } else {
            $("#joueur2").append('<img class="serve-l" src="icon/vol.svg" alt="Service" />');
        }

        this.setInfoTxt( this.service.getNomJoueur() + " sert" );


    }

    /**
     * Permet de joueur le signal sonore de début ou fin
     * @private
     */
    private playSong() : void {

        // Jouer le fichier other/start.mp3
        let audio = new Audio('other/start.mp3');

        audio.play();


    }

    /**
     * Jouer le signal lorsqu'il s'agit d'un point important
     * @private
     */
    private importantPoint() : void {

        let audio = new Audio('other/horn.mp3');

        audio.play();

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
    /** Nombre de points du joueur */
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

    public addPoint() : void {

        this.points++;

    }

    public addSet() : void {

        this.points = 0;
        this.sets++;

    }

    /** Récupérer le nombre de points pour le jeu en cours */
    public getPoint() : number { return this.points; }

    /** Récupérer le nombre de sets pour le jeu en cours */
    public getSet () : number { return this.sets; }

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

}


/********* EVENTS *********/

window.addEventListener('beforeunload', (event) => {
    const confirmationMessage = 'Êtes-vous sûr de vouloir quitter ou recharger la page ?';
    event.returnValue = confirmationMessage;
    return confirmationMessage;
});