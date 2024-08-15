/*
 * Copyright (c) 2024. SCORE SMASH
 * ScoreSmash - Développé par Joey CAZO
 * License : Apache-2.0, Août 2024
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import favicon from 'serve-favicon';
const app = express();
const port = 3000;
// Convertir l'URL du fichier actuel en chemin
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
// Obtenir le nom du répertoire à partir du chemin
const __dirname = path.dirname(__filename);
// Servir les fichiers statiques depuis le répertoire "src"
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'icon')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(favicon(path.join(__dirname, 'icon', 'favicon.ico')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));
app.get('/', (req, res) => {
    res.render('start', {});
});
app.get('/badminton', (req, res) => {
    res.render('badminton', {});
});
app.listen(port, () => {
    console.log(`En cours sur : http://localhost:${port}`);
});
