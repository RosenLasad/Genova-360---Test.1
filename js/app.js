(function(){
  "use strict";
  var points=window.LAB_POINTS||[];
  var current=null,mediaIndex=0,localObjectUrl="",localType="",viewer=null;
  var $=function(id){return document.getElementById(id);};
  var list=$("point-list"),search=$("search-input"),modal=$("point-modal"),video=$("past-video"),empty=$("media-empty");
  var vrOverlay=$("vr-overlay"),canvas=$("vr-canvas"),fallback=$("vr-fallback");

  function statusClass(s){s=(s||"").toLowerCase();if(s.indexOf("pront")>=0)return"status-ready";if(s.indexOf("prova")>=0||s.indexOf("test")>=0)return"status-test";return"status-source";}
  function renderList(filter){
    filter=(filter||"").trim().toLowerCase();list.innerHTML="";var shown=0;
    points.forEach(function(p){var hay=(p.nome+" "+(p.gruppo||"")+" "+(p.descrizione||"")).toLowerCase();if(filter&&hay.indexOf(filter)<0)return;shown++;var b=document.createElement("button");b.type="button";b.className="point-card";b.innerHTML='<h3>'+escapeHtml(p.nome)+'</h3><p>'+escapeHtml(p.gruppo||"Punto QR")+'</p><div class="point-meta"><span>'+(p.ieri?p.ieri.length:0)+' video Ieri</span><span class="status '+statusClass(p.stato)+'">'+escapeHtml(p.stato||"Test")+'</span></div>';b.addEventListener("click",function(){openPoint(p);});list.appendChild(b);});
    $("point-count").textContent=String(shown);if(!shown){list.innerHTML='<div class="empty-list">Nessun punto trovato.</div>';}
  }
  function escapeHtml(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c];});}
  function filename(path){return String(path||"").split(/[\\/]/).pop()||"Nessun file";}
  function openPoint(p){current=p;mediaIndex=0;clearLocal();$("modal-title").textContent=p.nome;$("modal-description").textContent=p.descrizione||"";modal.hidden=false;document.body.style.overflow="hidden";loadOriginal();setTimeout(function(){$("modal-close").focus();},0);}
  function closePoint(){video.pause();modal.hidden=true;if(vrOverlay.hidden)document.body.style.overflow="";clearLocal();}
  function clearLocal(){if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl="";}localType="";$("local-file").value="";}
  function currentPath(){return current&&current.ieri&&current.ieri.length?current.ieri[Math.max(0,Math.min(mediaIndex,current.ieri.length-1))]:"";}
  function loadOriginal(){
    if(!current)return;var path=currentPath();empty.hidden=true;video.hidden=false;video.pause();video.removeAttribute("src");video.load();
    if(!path){showMissing("Nessun video configurato");return;}
    video.src=path;video.load();$("source-name").textContent=filename(path);$("source-status").textContent="Caricamento…";updateCounter();
    var failed=false;
    video.addEventListener("loadedmetadata",function(){$("source-status").textContent="Video pronto • "+(video.videoWidth||"?")+"×"+(video.videoHeight||"?");},{once:true});
    video.addEventListener("canplay",function(){$("source-status").textContent="Video riproducibile";},{once:true});
    var onErr=function(){if(failed)return;failed=true;var code=video.error&&video.error.code;showMissing("Errore video"+(code?" (codice "+code+")":"")+": "+filename(path));};video.addEventListener("error",onErr,{once:true});
  }
  function showMissing(msg){video.hidden=true;empty.hidden=false;empty.querySelector("strong").textContent=msg;$("source-name").textContent=filename(currentPath());$("source-status").textContent="Usa “File locale…”";updateCounter();}
  function updateCounter(){var n=(current&&current.ieri&&current.ieri.length)||1;$("media-counter").textContent=(mediaIndex+1)+" / "+n;$("prev-media").disabled=n<=1;$("next-media").disabled=n<=1;}
  function selectLocal(file){clearLocal();localObjectUrl=URL.createObjectURL(file);localType=file.type.indexOf("video/")===0?"video":"image";$("source-name").textContent=file.name;$("source-status").textContent="File locale";if(localType==="video"){empty.hidden=true;video.hidden=false;video.src=localObjectUrl;video.load();video.play().catch(function(){});}else{video.pause();video.hidden=true;empty.hidden=false;empty.querySelector("strong").textContent="Immagine locale selezionata";empty.querySelector("span").textContent="Premi 360° per aprirla nel viewer.";}}
  function fmt(t){if(!isFinite(t))return"0:00";var m=Math.floor(t/60),s=Math.floor(t%60);return m+":"+String(s).padStart(2,"0");}
  function updateVideoUi(){var d=video.duration||0,c=video.currentTime||0;$("video-progress").value=d?Math.round(c/d*1000):0;$("video-time").textContent=fmt(c)+" / "+fmt(d);$("video-play").textContent=video.paused?"▶":"❚❚";}

  async function openVR(){
    if(!current)return;video.pause();vrOverlay.hidden=false;modal.hidden=true;document.body.style.overflow="hidden";$("vr-title").textContent=current.nome;fallback.hidden=true;
    if(!viewer){try{viewer=new window.VRViewer(canvas);viewer.onFovChange=function(v){$("fov-range").value=Math.round(v);$("fov-out").textContent=Math.round(v)+"°";};}catch(e){fallback.hidden=false;fallback.querySelector("strong").textContent="Viewer non disponibile";fallback.querySelector("span").textContent=e.message;return;}}
    var useLocal=!!localObjectUrl,src="",type="image",projection=current.proiezione||"equirect";
    if(useLocal){src=localObjectUrl;type=localType;projection=localType==="video"?"flat180":"equirect";}
    else if(current.panorama){src=current.panorama;type=current.panoramaTipo||(/\.mp4(?:$|\?)/i.test(src)?"video":"image");projection=current.proiezione||"equirect";}
    else{src=currentPath();type="video";projection="flat180";}
    $("projection-select").value=projection;$("limit-select").value=String(current.limite||180);viewer.setProjection(projection);viewer.setLimit(current.limite||180);viewer.setView({yaw:0,pitch:0,fov:80});syncControls();$("vr-source-info").textContent="Sorgente: "+filename(src)+(projection==="flat180"?" • adattamento sperimentale":" • panorama")+" • motore: "+viewer.getBackend();
    try{await viewer.load(src,type);viewer.setLoop($("loop-video").checked);}catch(e){
      if(!useLocal && current.panorama && currentPath()){
        try{src=currentPath();type="video";projection="flat180";$("projection-select").value=projection;viewer.setProjection(projection);$("vr-source-info").textContent="Panorama non disponibile: uso sperimentale di "+filename(src)+" • motore: "+viewer.getBackend();await viewer.load(src,type);}catch(e2){showVrError(e2.message);}
      }else{showVrError(e.message);}
    }
  }
  function showVrError(msg){fallback.hidden=false;fallback.querySelector("strong").textContent="Sorgente non disponibile";fallback.querySelector("span").textContent=msg+". Seleziona prima “File locale…” nel popup.";}
  function closeVR(){if(viewer){viewer.disableGyro();$("gyro-btn").classList.remove("is-on");}vrOverlay.hidden=true;modal.hidden=false;$("test-panel").hidden=true;}
  function syncControls(){if(!viewer)return;$("fov-range").value=Math.round(viewer.fov);$("fov-out").textContent=Math.round(viewer.fov)+"°";$("yaw-range").value=Math.round(viewer.baseYaw);$("yaw-out").textContent=Math.round(viewer.baseYaw)+"°";$("pitch-range").value=Math.round(viewer.basePitch);$("pitch-out").textContent=Math.round(viewer.basePitch)+"°";}

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
  $("fov-range").addEventListener("input",function(){if(!viewer)return;viewer.fov=+this.value;viewer.dirty=true;$("fov-out").textContent=this.value+"°";});
  $("yaw-range").addEventListener("input",function(){if(!viewer)return;viewer.baseYaw=viewer.yaw=+this.value;viewer.dirty=true;$("yaw-out").textContent=this.value+"°";});
  $("pitch-range").addEventListener("input",function(){if(!viewer)return;viewer.basePitch=viewer.pitch=+this.value;viewer.dirty=true;$("pitch-out").textContent=this.value+"°";});
  $("limit-select").addEventListener("change",function(){viewer&&viewer.setLimit(+this.value);});
  $("auto-rotate").addEventListener("change",function(){viewer&&viewer.setAutoRotate(this.checked);});$("loop-video").addEventListener("change",function(){viewer&&viewer.setLoop(this.checked);});
  $("reset-view").addEventListener("click",function(){if(viewer){viewer.reset();syncControls();}});$("play-vr-media").addEventListener("click",function(){viewer&&viewer.toggleMedia();});
  $("gyro-btn").addEventListener("click",async function(){if(!viewer)return;if(viewer.gyro){viewer.disableGyro();this.classList.remove("is-on");this.textContent="📱 Movimento";return;}try{await viewer.requestGyro();this.classList.add("is-on");this.textContent="📱 Attivo";}catch(e){alert("Movimento non attivato: "+e.message+". Su smartphone usa HTTPS (es. Netlify) e autorizza i sensori.");}});
  $("vr-fullscreen").addEventListener("click",function(){var el=$("vr-shell");if(document.fullscreenElement){document.exitFullscreen&&document.exitFullscreen();}else if(el.requestFullscreen){el.requestFullscreen().catch(function(){});}});
  document.addEventListener("keydown",function(e){if(e.key!=="Escape")return;if(!vrOverlay.hidden)closeVR();else if(!modal.hidden)closePoint();});
  renderList("");
})();
