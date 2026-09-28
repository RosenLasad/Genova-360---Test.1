/*
 * Genova mApp — 360 Lab
 * Aggiungi/modifica i punti qui. I percorsi sono relativi a index.html.
 * Se un file non esiste, puoi comunque sceglierlo manualmente dal popup.
 */
window.LAB_POINTS = [
  {
    id: "caricamento-portici",
    nome: "Portici in piazza di Caricamento",
    gruppo: "Piazza Caricamento",
    descrizione: "I portici di Sottoripa, costruiti tra il 1125 e il 1133, sono tra i più antichi porticati pubblici d’Italia. Questo punto è predisposto come test per verificare l’adattamento di un normale video “Ieri” alla visuale immersiva.",
    stato: "Da provare",
    ieri: ["video/caricamento_ieri_1.mp4"],
    panorama: "",
    panoramaTipo: "video",
    proiezione: "flat180",
    limite: 180
  },
  {
    id: "piazza-raibetta",
    nome: "Piazza Raibetta",
    gruppo: "Piazza Caricamento",
    descrizione: "Punto di laboratorio con due video “Ieri”. Puoi passare da un video all’altro e provare ciascun file nel viewer 180° sperimentale.",
    stato: "Originale",
    ieri: ["video/raibetta_ieri_1.mp4", "video/raibetta_ieri_2.mp4"],
    panorama: "",
    panoramaTipo: "video",
    proiezione: "flat180",
    limite: 180
  },
  {
    id: "caricamento-san-giorgio",
    nome: "Piazza Caricamento su S. Giorgio",
    gruppo: "Piazza Caricamento",
    descrizione: "Un punto con più sorgenti storiche, utile per confrontare fotografie/video diversi e decidere quale sia il più adatto a una ricostruzione panoramica.",
    stato: "Originale",
    ieri: ["video/caricsangiorgio_ieri_1.mp4", "video/caricsangiorgio_ieri_2.mp4", "video/caricsangiorgio_ieri_3.mp4"],
    panorama: "",
    panoramaTipo: "video",
    proiezione: "flat180",
    limite: 180
  },
  {
    id: "piazza-principe",
    nome: "Piazza Principe",
    gruppo: "Piazza Principe",
    descrizione: "Segnaposto per uno dei prossimi test. Inserisci i file nella cartella video e aggiorna i nomi in js/punti.js.",
    stato: "Da preparare",
    ieri: ["video/piazza_principe_ieri_1.mp4"],
    panorama: "",
    panoramaTipo: "video",
    proiezione: "flat180",
    limite: 180
  },
  {
    id: "via-xx-settembre",
    nome: "Via XX Settembre",
    gruppo: "Via XX Settembre",
    descrizione: "Segnaposto per sperimentare una visuale con forte profondità prospettica, particolarmente interessante per l’effetto soggettivo.",
    stato: "Da preparare",
    ieri: ["video/via_settembre_ieri_1.mp4"],
    panorama: "",
    panoramaTipo: "video",
    proiezione: "flat180",
    limite: 180
  }
];
