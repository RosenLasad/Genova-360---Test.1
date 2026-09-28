/*
 * Genova mApp — 360 Lab
 * I contenuti "Ieri" e VR sono indipendenti.
 * Per attivare il bottone VR di un punto, assegna vr.src.
 * angle indica l’ampiezza orizzontale reale della scena: 120, 240, 360 o un valore personalizzato.
 * I percorsi sono relativi a index.html.
 */
window.LAB_POINTS = [
  {
    id: "caricamento-portici",
    nome: "Portici in piazza di Caricamento",
    gruppo: "Piazza Caricamento",
    descrizione: "I portici di Sottoripa, costruiti tra il 1125 e il 1133, sono tra i più antichi porticati pubblici d’Italia. Questo punto è predisposto come test per verificare la visuale immersiva sul passato.",
    stato: "Da provare",
    ieri: ["video/caricamento_ieri_1.mp4"],
    vr: {
      src: "video/caricamento_ieri_1.mp4",
      type: "video",
      projection: "flatvr",
      angle: 180,
      fov: 80,
      yaw: 0,
      pitch: 0,
            minPitch: -40,
      maxPitch: 40,
      loop: true,
      audio: true
    }
  },
  {
    id: "piazza-raibetta",
    nome: "Piazza Raibetta",
    gruppo: "Piazza Caricamento",
    descrizione: "Punto di laboratorio con video storico e sorgente VR configurata separatamente, così il contenuto immersivo potrà essere sostituito senza modificare il video Ieri.",
    stato: "Da provare",
    ieri: ["video/raibetta_ieri_1.mp4", "video/raibetta_ieri_2.mp4"],
    vr: {
      src: "video/raibetta_ieri_1.mp4",
      type: "video",
      projection: "flatvr",
      angle: 120,
      fov: 80,
      yaw: 0,
      pitch: 0,
            minPitch: -40,
      maxPitch: 40,
      loop: true,
      audio: true
    }
  },
  {
    id: "caricamento-san-giorgio",
    nome: "Piazza Caricamento su S. Giorgio",
    gruppo: "Piazza Caricamento",
    descrizione: "Un punto con più sorgenti storiche. Il bottone VR comparirà quando verrà assegnato un file dedicato in vr.src.",
    stato: "Originale",
    ieri: ["video/caricsangiorgio_ieri_1.mp4", "video/caricsangiorgio_ieri_2.mp4", "video/caricsangiorgio_ieri_3.mp4"],
    vr: null
  },
  {
    id: "piazza-principe",
    nome: "Piazza Principe",
    gruppo: "Piazza Principe",
    descrizione: "Segnaposto per uno dei prossimi test. Il contenuto VR potrà essere collocato in una cartella indipendente e indicato in vr.src.",
    stato: "Da preparare",
    ieri: ["video/piazza_principe_ieri_1.mp4"],
    vr: null
  },
  {
    id: "via-xx-settembre",
    nome: "Via XX Settembre",
    gruppo: "Via XX Settembre",
    descrizione: "Segnaposto per sperimentare una visuale con forte profondità prospettica. Il contenuto immersivo sarà indipendente dal video Ieri.",
    stato: "Da preparare",
    ieri: ["video/via_settembre_ieri_1.mp4"],
    vr: null
  }
];
