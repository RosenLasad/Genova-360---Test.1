/*
 * Genova mApp — 360 Lab
 * I contenuti "Ieri" e VR sono indipendenti.
 * Tutti i 5 punti del Lab sono predisposti per la modalità VR.
 * angle indica l'ampiezza orizzontale reale della scena: 120, 180, 240, 360 o un valore personalizzato.
 * I percorsi sono relativi a index.html.
 */
window.LAB_POINTS = [
  {
    id: "caricamento-portici",
    nome: "Portici in piazza di Caricamento",
    gruppo: "Piazza Caricamento",
    descrizione: "I portici di Sottoripa, costruiti tra il 1125 e il 1133, sono tra i più antichi porticati pubblici d'Italia. Questo punto è predisposto come test per verificare la visuale immersiva sul passato.",
    stato: "VR pronto",
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
    stato: "VR pronto",
    ieri: ["video/raibetta_ieri_1.mp4", "video/raibetta_ieri_2.mp4"],
    vr: {
      src: "video/raibetta_ieri_1.mp4",
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
    id: "caricamento-san-giorgio",
    nome: "Piazza Caricamento su S. Giorgio",
    gruppo: "Piazza Caricamento",
    descrizione: "Punto predisposto per la modalità VR. Per ora la sorgente VR usa il primo video storico previsto; potrà essere sostituita in qualsiasi momento con un MP4 dedicato.",
    stato: "VR predisposto",
    ieri: ["video/caricsangiorgio_ieri_1.mp4", "video/caricsangiorgio_ieri_2.mp4", "video/caricsangiorgio_ieri_3.mp4"],
    vr: {
      src: "video/caricsangiorgio_ieri_1.mp4",
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
    id: "piazza-principe",
    nome: "Piazza Principe",
    gruppo: "Piazza Principe",
    descrizione: "Punto predisposto per la modalità VR. Il percorso VR è indipendente e potrà essere sostituito con il video panoramico dedicato di Piazza Principe.",
    stato: "VR predisposto",
    ieri: ["video/piazza_principe_ieri_1.mp4"],
    vr: {
      src: "video/piazza_principe_ieri_1.mp4",
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
    id: "via-xx-settembre",
    nome: "Via XX Settembre",
    gruppo: "Via XX Settembre",
    descrizione: "Punto predisposto per una visuale VR con forte profondità prospettica. La sorgente immersiva è configurata separatamente dal video Ieri.",
    stato: "VR pronto",
    ieri: ["video/via_settembre_ieri_1.mp4"],
    vr: {
      src: "video/via_settembre_ieri_1.mp4",
      type: "video",
      projection: "flatvr",
      angle: 270,
      fov: 80,
      yaw: 0,
      pitch: 0,
      minPitch: -40,
      maxPitch: 40,
      loop: true,
      audio: true
    }
  }
];
