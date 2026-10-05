(function(){
  "use strict";
  var points=window.LAB_POINTS||[];
  var current=null,mediaIndex=0,localObjectUrl="",localType="",viewer=null,vrReturnToModal=true,quickVideoFile=null,quickObjectUrl="";
  var $=function(id){return document.getElementById(id);};
  var list=$("point-list"),search=$("search-input"),modal=$("point-modal"),video=$("past-video"),empty=$("media-empty");
  var vrOverlay=$("vr-overlay"),canvas=$("vr-canvas"),fallback=$("vr-fallback"),loader=$("vr-loader");
  var quickDrop=$("quick-drop-zone"),quickInput=$("quick-local-file"),quickInfo=$("quick-file-info");

  function statusClass(s){s=(s||"").toLowerCase();if(s.indexOf("pront")>=0)return"status-ready";if(s.indexOf("prova")>=0||s.indexOf("test")>=0)return"status-test";return"status-source";}
  function renderList(filter){
    filter=(filter||"").trim().toLowerCase();list.innerHTML="";var shown=0;
    points.forEach(function(p){var hay=(p.nome+" "+(p.gruppo||"")+" "+(p.descrizione||"")).toLowerCase();if(filter&&hay.indexOf(filter)<0)return;shown++;var b=document.createElement("button");b.type="button";b.className="point-card";var hasVr=!!(p.vr&&p.vr.src);b.innerHTML='<h3>'+escapeHtml(p.nome)+'</h3><p>'+escapeHtml(p.gruppo||"Punto QR")+'</p><div class="point-meta"><span>'+(p.ieri?p.ieri.length:0)+' video Ieri'+(hasVr?' • VR':'')+'</span><span class="status '+statusClass(p.stato)+'">'+escapeHtml(p.stato||"Test")+'</span></div>';b.addEventListener("click",function(){openPoint(p);});list.appendChild(b);});
    $("point-count").textContent=String(shown);if(!shown){list.innerHTML='<div class="empty-list">Nessun punto trovato.</div>';}
  }
  function escapeHtml(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c];});}
  function filename(path){return String(path||"").split(/[\\/]/).pop()||"Nessun file";}
  function getVrConfig(){return current&&current.vr?current.vr:null;}
  function hasVrSource(){var vr=getVrConfig();return !!localObjectUrl||!!(vr&&vr.src);}
  function updateVrButton(){$("open-vr").hidden=!hasVrSource();}
  function openPoint(p){current=p;mediaIndex=0;clearLocal();$("modal-title").textContent=p.nome;$("modal-description").textContent=p.descrizione||"";modal.hidden=false;document.body.style.overflow="hidden";loadOriginal();updateVrButton();setTimeout(function(){$("modal-close").focus();},0);}
  function closePoint(){video.pause();modal.hidden=true;if(vrOverlay.hidden)document.body.style.overflow="";clearLocal();}
  function clearLocal(){if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl="";}localType="";$("local-file").value="";updateVrButton();}
  function currentPath(){return current&&current.ieri&&current.ieri.length?current.ieri[Math.max(0,Math.min(mediaIndex,current.ieri.length-1))]:"";}
  function loadOriginal(){
    if(!current)return;var path=currentPath();empty.hidden=true;video.hidden=false;video.pause();video.removeAttribute("src");video.load();
    if(!path){showMissing("Nessun video configurato");return;}
    video.src=path;video.load();$("source-name").textContent=filename(path);$("source-status").textContent="Caricamento…";updateCounter();
    var failed=false;
    video.addEventListener("loadedmetadata",function(){$("source-status").textContent="Video pronto • "+(video.videoWidth||"?")+"×"+(video.videoHeight||"?");},{once:true});
    video.addEventListener("canplay",function(){$("source-status").textContent="Video riproducibile";},{once:true});
    video.addEventListener("error",function(){if(failed)return;failed=true;var code=video.error&&video.error.code;showMissing("Errore video"+(code?" (codice "+code+")":"")+": "+filename(path));},{once:true});
  }
  function showMissing(msg){video.hidden=true;empty.hidden=false;empty.querySelector("strong").textContent=msg;$("source-name").textContent=filename(currentPath());$("source-status").textContent="Usa “File locale…”";updateCounter();}
  function updateCounter(){var n=(current&&current.ieri&&current.ieri.length)||1;$("media-counter").textContent=(mediaIndex+1)+" / "+n;$("prev-media").disabled=n<=1;$("next-media").disabled=n<=1;}
  function selectLocal(file){clearLocal();localObjectUrl=URL.createObjectURL(file);localType=file.type.indexOf("video/")===0?"video":"image";$("source-name").textContent=file.name;$("source-status").textContent="File locale";if(localType==="video"){empty.hidden=true;video.hidden=false;video.src=localObjectUrl;video.load();video.play().catch(function(){});}else{video.pause();video.hidden=true;empty.hidden=false;empty.querySelector("strong").textContent="Immagine locale selezionata";empty.querySelector("span").textContent="Premi VR per aprirla nel viewer.";}updateVrButton();}
  function isVideoFile(file){return !!(file&&(file.type.indexOf("video/")===0||/\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name||"")));}
  function formatBytes(bytes){if(!isFinite(bytes)||bytes<=0)return"";var units=["B","KB","MB","GB"],i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);return(bytes/Math.pow(1024,i)).toFixed(i?1:0)+" "+units[i];}
  function clearQuickVideo(){
    quickVideoFile=null;
    if(quickObjectUrl){URL.revokeObjectURL(quickObjectUrl);quickObjectUrl="";}
    quickInput.value="";quickInfo.hidden=true;quickDrop.hidden=false;quickDrop.classList.remove("is-dragging");
  }
  function selectQuickVideo(file){
    if(!isVideoFile(file)){alert("Seleziona un file video compatibile (per esempio MP4 o WebM).");return;}
    if(quickObjectUrl)URL.revokeObjectURL(quickObjectUrl);
    quickVideoFile=file;quickObjectUrl=URL.createObjectURL(file);
    $("quick-file-name").textContent=file.name;$("quick-file-meta").textContent=(formatBytes(file.size)||"Video locale")+" • lettura dal computer";
    quickDrop.hidden=true;quickInfo.hidden=false;
    var probe=document.createElement("video");probe.preload="metadata";probe.muted=true;probe.src=quickObjectUrl;
    probe.addEventListener("loadedmetadata",function(){var parts=[];if(probe.videoWidth&&probe.videoHeight)parts.push(probe.videoWidth+"×"+probe.videoHeight);if(isFinite(probe.duration))parts.push(fmt(probe.duration));var size=formatBytes(file.size);if(size)parts.push(size);parts.push("file locale");$("quick-file-meta").textContent=parts.join(" • ");probe.removeAttribute("src");probe.load();},{once:true});
  }
  function openQuickVR(){
    if(!quickVideoFile||!quickObjectUrl)return;
    current={nome:quickVideoFile.name,descrizione:"Test rapido di un video locale",vr:{src:quickObjectUrl,type:"video",projection:"flatvr",angle:120,verticalAngle:80,fov:80,yaw:0,pitch:0,minYaw:-60,maxYaw:60,minPitch:-40,maxPitch:40,loop:true,audio:true}};
    openVR();
  }
  function fmt(t){if(!isFinite(t))return"0:00";var m=Math.floor(t/60),s=Math.floor(t%60);return m+":"+String(s).padStart(2,"0");}
  function updateVideoUi(){var d=video.duration||0,c=video.currentTime||0;$("video-progress").value=d?Math.round(c/d*1000):0;$("video-time").textContent=fmt(c)+" / "+fmt(d);$("video-play").textContent=video.paused?"▶":"❚❚";}
  function setLoader(on){loader.hidden=!on;}
  function setAudioUi(muted,isVideo){var b=$("vr-audio");b.hidden=!isVideo;if(!isVideo)return;b.textContent=muted?"🔇":"🔊";b.setAttribute("aria-label",muted?"Attiva audio":"Silenzia audio");b.title=muted?"Attiva audio":"Silenzia audio";}

  function normalizeAngle(v){
    v=+v;if(!isFinite(v))v=120;return Math.max(60,Math.min(360,v));
  }
  function ensureAngleOption(angle){
    var sel=$("angle-select"),value=String(Math.round(angle));
    var found=Array.prototype.some.call(sel.options,function(o){return o.value===value;});
    if(!found){var o=document.createElement("option");o.value=value;o.textContent="VR "+value+"°";sel.appendChild(o);}
    sel.value=value;
  }
  function applySceneConfig(vr){
    vr=vr||{};
    var angle=normalizeAngle(vr.angle!=null?vr.angle:(vr.range!=null?vr.range:120));
    var yaw=vr.yaw==null?0:+vr.yaw;
    var pitch=vr.pitch==null?0:+vr.pitch;
    var minYaw=vr.minYaw==null?yaw-angle/2:+vr.minYaw;
    var maxYaw=vr.maxYaw==null?yaw+angle/2:+vr.maxYaw;
    var minPitch=vr.minPitch==null?-40:+vr.minPitch;
    var maxPitch=vr.maxPitch==null?40:+vr.maxPitch;
    var projection=vr.projection||"flatvr";
    if(projection==="flat180")projection="flatvr"; // compatibilità con configurazioni precedenti
    viewer.setContentAngle(angle);
    var verticalAngle=vr.verticalAngle==null?Math.max(10,Math.min(180,angle/1.5)):+vr.verticalAngle;
    viewer.setVerticalAngle(verticalAngle);
    viewer.setProjection(projection);
    viewer.setLimits({minYaw:minYaw,maxYaw:maxYaw,minPitch:minPitch,maxPitch:maxPitch});
    viewer.setView({yaw:yaw,pitch:pitch,fov:vr.fov==null?80:+vr.fov});
    $("projection-select").value=projection;
    ensureAngleOption(angle);
    syncControls();
  }

  async function openVR(){
    if(!current||!hasVrSource())return;
    vrReturnToModal=!modal.hidden;
    video.pause();vrOverlay.hidden=false;modal.hidden=true;document.body.style.overflow="hidden";$("vr-title").textContent=current.nome;fallback.hidden=true;setLoader(true);
    if(!viewer){
      try{
        viewer=new window.VRViewer(canvas);
        viewer.onFovChange=function(v){$("fov-range").value=Math.round(v);$("fov-out").textContent=Math.round(v)+"°";};
        viewer.onMuteChange=function(m){setAudioUi(m,viewer.sourceType==="video");};
      }catch(e){setLoader(false);fallback.hidden=false;fallback.querySelector("strong").textContent="Viewer non disponibile";fallback.querySelector("span").textContent=e.message;return;}
    }
    var vr=getVrConfig()||{};
    var useLocal=!!localObjectUrl;
    var src=useLocal?localObjectUrl:vr.src;
    var type=useLocal?localType:(vr.type||(/\.mp4(?:$|\?)/i.test(src)?"video":"image"));
    var localVr=useLocal?{projection:type==="video"?"flatvr":"equirect",angle:120,verticalAngle:80,fov:80,yaw:0,pitch:0,minPitch:-40,maxPitch:40,loop:true,audio:true}:vr;
    applySceneConfig(localVr);
    viewer.setAutoRotate(false);$("auto-rotate").checked=false;
    $("gyro-btn").hidden=!viewer.supportsGyro();
    setAudioUi(false,type==="video");
    var sceneAngle=normalizeAngle(localVr.angle!=null?localVr.angle:(localVr.range!=null?localVr.range:120));
    $("vr-source-info").textContent="Sorgente VR: "+filename(src)+" • "+Math.round(sceneAngle)+"° × "+Math.round(viewer.verticalAngle)+"° • motore: "+viewer.getBackend();
    try{
      await viewer.load(src,type,{loop:true,audio:localVr.audio!==false});
      viewer.setLoop(true);
      setAudioUi(viewer.isMuted(),type==="video");
      setLoader(false);
    }catch(e){setLoader(false);showVrError(e.message);}
  }
  function showVrError(msg){fallback.hidden=false;fallback.querySelector("strong").textContent="Sorgente VR non disponibile";fallback.querySelector("span").textContent=msg+".";}
  function closeVR(){if(viewer){viewer.disableGyro();if(viewer.sourceType==="video"&&viewer.source){try{viewer.source.pause();}catch(_){}}$("gyro-btn").classList.remove("is-on");$("gyro-btn").textContent="📱 Movimento";}setLoader(false);vrOverlay.hidden=true;modal.hidden=!vrReturnToModal;$("test-panel").hidden=true;if(!vrReturnToModal)document.body.style.overflow="";}
  function syncControls(){
    if(!viewer)return;
    $("fov-range").value=Math.round(viewer.fov);$("fov-out").textContent=Math.round(viewer.fov)+"°";
    $("vertical-angle-range").value=Math.round(viewer.verticalAngle);$("vertical-angle-out").textContent=Math.round(viewer.verticalAngle)+"°";
    $("ratio-out").textContent=(viewer.contentAngle/viewer.verticalAngle).toFixed(2)+":1";
    $("yaw-range").value=Math.round(viewer.baseYaw);$("yaw-out").textContent=Math.round(viewer.baseYaw)+"°";
    $("pitch-range").value=Math.round(viewer.basePitch);$("pitch-out").textContent=Math.round(viewer.basePitch)+"°";
    $("min-yaw-range").value=Math.round(viewer.minYaw);$("min-yaw-out").textContent=Math.round(viewer.minYaw)+"°";
    $("max-yaw-range").value=Math.round(viewer.maxYaw);$("max-yaw-out").textContent=Math.round(viewer.maxYaw)+"°";
    $("min-pitch-range").value=Math.round(viewer.minPitch);$("min-pitch-out").textContent=Math.round(viewer.minPitch)+"°";
    $("max-pitch-range").value=Math.round(viewer.maxPitch);$("max-pitch-out").textContent=Math.round(viewer.maxPitch)+"°";
  }
  function updateLimitsFromUi(){if(!viewer)return;viewer.setLimits({minYaw:+$("min-yaw-range").value,maxYaw:+$("max-yaw-range").value,minPitch:+$("min-pitch-range").value,maxPitch:+$("max-pitch-range").value});syncControls();}

  $("quick-pick-file").addEventListener("click",function(e){e.stopPropagation();quickInput.click();});
  $("quick-change-file").addEventListener("click",function(){quickInput.click();});
  $("quick-open-vr").addEventListener("click",openQuickVR);
  quickDrop.addEventListener("click",function(){quickInput.click();});
  quickDrop.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();quickInput.click();}});
  quickInput.addEventListener("change",function(){if(this.files&&this.files[0])selectQuickVideo(this.files[0]);});
  ["dragenter","dragover"].forEach(function(name){quickDrop.addEventListener(name,function(e){e.preventDefault();e.stopPropagation();quickDrop.classList.add("is-dragging");});});
  ["dragleave","drop"].forEach(function(name){quickDrop.addEventListener(name,function(e){e.preventDefault();e.stopPropagation();quickDrop.classList.remove("is-dragging");});});
  quickDrop.addEventListener("drop",function(e){var file=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(file)selectQuickVideo(file);});

  search.addEventListener("input",function(){renderList(search.value);});
  $("modal-close").addEventListener("click",closePoint);modal.addEventListener("click",function(e){if(e.target===modal)closePoint();});
  $("video-play").addEventListener("click",function(){if(video.hidden)return;video.paused?video.play().catch(function(){}):video.pause();});video.addEventListener("timeupdate",updateVideoUi);video.addEventListener("durationchange",updateVideoUi);video.addEventListener("play",updateVideoUi);video.addEventListener("pause",updateVideoUi);
  $("video-progress").addEventListener("input",function(){if(video.duration)video.currentTime=(+this.value/1000)*video.duration;});
  $("prev-media").addEventListener("click",function(){if(!current||!current.ieri.length)return;mediaIndex=(mediaIndex-1+current.ieri.length)%current.ieri.length;clearLocal();loadOriginal();});
  $("next-media").addEventListener("click",function(){if(!current||!current.ieri.length)return;mediaIndex=(mediaIndex+1)%current.ieri.length;clearLocal();loadOriginal();});
  $("pick-file").addEventListener("click",function(){$("local-file").click();});$("local-file").addEventListener("change",function(){if(this.files&&this.files[0])selectLocal(this.files[0]);});
  $("open-vr").addEventListener("click",openVR);$("vr-close").addEventListener("click",closeVR);
  $("test-toggle").addEventListener("click",function(){$("test-panel").hidden=!$("test-panel").hidden;});$("test-close").addEventListener("click",function(){$("test-panel").hidden=true;});
  $("projection-select").addEventListener("change",function(){viewer&&viewer.setProjection(this.value);});
  $("angle-select").addEventListener("change",function(){
    if(!viewer)return;
    var angle=normalizeAngle(this.value),center=viewer.baseYaw;
    viewer.setContentAngle(angle);
    viewer.setLimits({minYaw:center-angle/2,maxYaw:center+angle/2,minPitch:viewer.minPitch,maxPitch:viewer.maxPitch});
    syncControls();
    $("vr-source-info").textContent=$("vr-source-info").textContent.replace(/\d+° × \d+°/,Math.round(angle)+"° × "+Math.round(viewer.verticalAngle)+"°");
    $("ratio-out").textContent=(viewer.contentAngle/viewer.verticalAngle).toFixed(2)+":1";
  });
  $("vertical-angle-range").addEventListener("input",function(){
    if(!viewer)return;
    viewer.setVerticalAngle(+this.value);
    $("vertical-angle-out").textContent=Math.round(viewer.verticalAngle)+"°";
    $("ratio-out").textContent=(viewer.contentAngle/viewer.verticalAngle).toFixed(2)+":1";
    $("vr-source-info").textContent=$("vr-source-info").textContent.replace(/\d+° × \d+°/,Math.round(viewer.contentAngle)+"° × "+Math.round(viewer.verticalAngle)+"°");
  });
  $("fov-range").addEventListener("input",function(){if(!viewer)return;viewer.fov=+this.value;viewer.dirty=true;$("fov-out").textContent=this.value+"°";});
  $("yaw-range").addEventListener("input",function(){if(!viewer)return;viewer.baseYaw=viewer.yaw=+this.value;viewer.applyLimits();viewer.dirty=true;$("yaw-out").textContent=this.value+"°";});
  $("pitch-range").addEventListener("input",function(){if(!viewer)return;viewer.basePitch=viewer.pitch=+this.value;viewer.applyLimits();viewer.dirty=true;$("pitch-out").textContent=this.value+"°";});
  ["min-yaw-range","max-yaw-range","min-pitch-range","max-pitch-range"].forEach(function(id){$(id).addEventListener("input",updateLimitsFromUi);});
  $("auto-rotate").addEventListener("change",function(){viewer&&viewer.setAutoRotate(this.checked);});
  $("reset-view").addEventListener("click",function(){if(viewer){var vr=getVrConfig()||{};applySceneConfig(vr);}});
  $("vr-audio").addEventListener("click",function(){if(!viewer)return;var muted=viewer.toggleMuted();if(muted!==null)setAudioUi(muted,true);});
  $("gyro-btn").addEventListener("click",async function(){if(!viewer)return;if(viewer.gyro){viewer.disableGyro();this.classList.remove("is-on");this.textContent="📱 Movimento";return;}try{await viewer.requestGyro();this.classList.add("is-on");this.textContent="📱 Attivo";}catch(e){alert("Movimento non attivato: "+e.message+". Su smartphone usa HTTPS (es. Netlify) e autorizza i sensori.");}});
  $("vr-fullscreen").addEventListener("click",function(){var el=$("vr-shell");if(document.fullscreenElement){document.exitFullscreen&&document.exitFullscreen();}else if(el.requestFullscreen){el.requestFullscreen().catch(function(){});}});
  document.addEventListener("keydown",function(e){if(e.key!=="Escape")return;if(!vrOverlay.hidden)closeVR();else if(!modal.hidden)closePoint();});

  // PWA: mostra l'installazione solo quando il browser la rende disponibile.
  (function initPwa(){
    var installBtn=$("install-app"),deferredPrompt=null;
    if(!installBtn)return;

    function isStandalone(){
      return window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches;
    }
    function hideInstall(){installBtn.hidden=true;}

    window.addEventListener("beforeinstallprompt",function(e){
      e.preventDefault();
      deferredPrompt=e;
      if(!isStandalone())installBtn.hidden=false;
    });

    installBtn.addEventListener("click",async function(){
      if(!deferredPrompt)return;
      installBtn.disabled=true;
      try{
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      }catch(_){
        // Il browser può annullare il prompt senza che sia un errore dell'app.
      }
      deferredPrompt=null;
      installBtn.disabled=false;
      hideInstall();
    });

    window.addEventListener("appinstalled",function(){deferredPrompt=null;hideInstall();});
    if(isStandalone())hideInstall();

    if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost"||location.hostname==="127.0.0.1")){
      window.addEventListener("load",function(){
        navigator.serviceWorker.register("service-worker.js").catch(function(err){
          console.warn("360 Lab: service worker non registrato",err);
        });
      });
    }
  })();

  renderList("");
})();
