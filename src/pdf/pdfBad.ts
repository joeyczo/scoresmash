// @ts-ignore
import { jsPDF } from '/node_modules/jspdf/dist/jspdf.node.js';

/** Informations du match pour créer le PDF */
interface dataLogMatch {
    winner      : number,
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

export class PDFBad {

    constructor(dataMatch: dataLogMatch) {
        let doc = new jsPDF();

        doc.setFillColor(160, 228, 196);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

        doc.setFontSize(40);
        doc.setTextColor(5, 60, 44);
        doc.text('Résumé des scores', 107, 49);

        doc.setFontSize(12);

        doc.text(JSON.stringify(dataMatch, null, 4), 20, 60);

        doc.setFontSize(8);
        doc.text('Session du ' + new Date().toLocaleDateString('fr-FR'), 37, 815);
        doc.text('Page 1', 525, 815);

        doc.save('scores.pdf');
    }
}