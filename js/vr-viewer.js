(function(){
  "use strict";

  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function rad(d){ return d*Math.PI/180; }

  function VRViewer(canvas){
    this.canvas=canvas;
    this.gl=null;
    this.ctx2d=null;
    this.backend="none";
    this.program=null;
    this.texture=null;
    this.source=null;
    this.sourceType="image";
    this.projection="flatvr";
    this.contentAngle=120;
    this.yaw=0;
    this.pitch=0;
    this.baseYaw=0;
    this.basePitch=0;
    this.fov=80;
    this.minYaw=-90;
    this.maxYaw=90;
    this.minPitch=-40;
    this.maxPitch=40;
    this.dragging=false;
    this.lastX=0;
    this.lastY=0;
    this.autoRotate=false;
    this.gyro=false;
    this.gyroZero=null;
    this.raf=0;
    this.dirty=true;
    this.ready=false;
    this._orientationHandler=this.onOrientation.bind(this);
    this.init();
  }

  VRViewer.prototype.init=function(){
    var webglError=null;
    try{
      var gl=this.canvas.getContext("webgl",{antialias:true,alpha:false,preserveDrawingBuffer:false}) || this.canvas.getContext("experimental-webgl");
      if(!gl) throw new Error("Contesto WebGL non disponibile");
      this.initWebGL(gl);
      this.backend="webgl";
    }catch(e){
      webglError=e;
      this.gl=null;
      try{
        this.ctx2d=this.canvas.getContext("2d",{alpha:false});
        if(!this.ctx2d) throw new Error("Canvas 2D non disponibile");
        this.backend="canvas2d";
      }catch(e2){
        throw new Error("Viewer grafico non disponibile. WebGL: "+(webglError&&webglError.message?webglError.message:"no")+"; Canvas: "+e2.message);
      }
    }
    this.bindEvents();
    this.ready=true;
    this.start();
  };

  VRViewer.prototype.initWebGL=function(gl){
    this.gl=gl;
    var vs='attribute vec2 a_pos; varying vec2 v_uv; void main(){ v_uv=(a_pos+1.0)*0.5; gl_Position=vec4(a_pos,0.0,1.0); }';
    var fs='precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform vec2 u_res; uniform float u_yaw; uniform float u_pitch; uniform float u_fov; uniform float u_proj; uniform float u_aspectTex; uniform float u_angle; const float PI=3.141592653589793; mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.0,-s,0.0,1.0,0.0,s,0.0,c);} mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.0,0.0,0.0,0.0,c,s,0.0,-s,c);} void main(){ vec2 p=(v_uv*2.0-1.0); p.x*=u_res.x/u_res.y; float z=1.0/tan(u_fov*0.5); vec3 dir=normalize(vec3(p.x,-p.y,z)); dir=rotY(u_yaw)*rotX(u_pitch)*dir; float lon=atan(dir.x,dir.z); float lat=asin(clamp(dir.y,-1.0,1.0)); vec2 uv; if(u_proj<0.5){ uv=vec2(0.5+lon/(2.0*PI),0.5-lat/PI); uv.x=fract(uv.x); } else { float span=clamp(u_angle,PI/3.0,2.0*PI); float halfH=span*0.5; if((span<2.0*PI-0.01 && abs(lon)>halfH) || abs(lat)>PI*0.32){ gl_FragColor=vec4(0.01,0.02,0.035,1.0); return; } float nx=lon/halfH; float ny=lat/(PI*0.32); float imageAspect=max(u_aspectTex,0.1); float targetAspect=1.75; float scaleX=min(1.0,imageAspect/targetAspect); float scaleY=min(1.0,targetAspect/imageAspect); uv=vec2(0.5+nx*0.5*scaleX,0.5-ny*0.5*scaleY); if(span>=2.0*PI-0.01){uv.x=fract(uv.x);} if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){gl_FragColor=vec4(0.01,0.02,0.035,1.0);return;} } vec4 c=texture2D(u_tex,uv); gl_FragColor=vec4(c.rgb,1.0); }';
    function shader(type,src){
      var s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)||"Errore shader WebGL");
      return s;
    }
    var prog=gl.createProgram();
    gl.attachShader(prog,shader(gl.VERTEX_SHADER,vs));
    gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog)||"Errore collegamento WebGL");
    this.program=prog; gl.useProgram(prog);
    var buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(prog,"a_pos"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    this.texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,this.texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([12,24,42,255]));
    this.u={res:gl.getUniformLocation(prog,"u_res"),yaw:gl.getUniformLocation(prog,"u_yaw"),pitch:gl.getUniformLocation(prog,"u_pitch"),fov:gl.getUniformLocation(prog,"u_fov"),proj:gl.getUniformLocation(prog,"u_proj"),aspectTex:gl.getUniformLocation(prog,"u_aspectTex"),angle:gl.getUniformLocation(prog,"u_angle")};
  };

  VRViewer.prototype.bindEvents=function(){
    var self=this,c=this.canvas;
    c.addEventListener("pointerdown",function(e){self.dragging=true;self.lastX=e.clientX;self.lastY=e.clientY;c.setPointerCapture&&c.setPointerCapture(e.pointerId);});
    c.addEventListener("pointermove",function(e){if(!self.dragging)return;var dx=e.clientX-self.lastX,dy=e.clientY-self.lastY;self.lastX=e.clientX;self.lastY=e.clientY;self.yaw-=dx*0.16;self.pitch+=dy*0.14;self.applyLimits();self.dirty=true;});
    function end(){self.dragging=false;} c.addEventListener("pointerup",end); c.addEventListener("pointercancel",end);
    c.addEventListener("wheel",function(e){e.preventDefault();self.fov=clamp(self.fov+Math.sign(e.deltaY)*4,35,110);self.dirty=true;if(self.onFovChange)self.onFovChange(self.fov);},{passive:false});
    window.addEventListener("resize",function(){self.dirty=true;});
  };

  VRViewer.prototype.applyLimits=function(){
    this.yaw=clamp(this.yaw,this.minYaw,this.maxYaw);
    this.pitch=clamp(this.pitch,this.minPitch,this.maxPitch);
  };
  VRViewer.prototype.setView=function(opts){opts=opts||{};if(opts.yaw!=null){this.yaw=+opts.yaw;this.baseYaw=+opts.yaw;}if(opts.pitch!=null){this.pitch=+opts.pitch;this.basePitch=+opts.pitch;}if(opts.fov!=null)this.fov=clamp(+opts.fov,35,110);this.applyLimits();this.dirty=true;};
  VRViewer.prototype.setProjection=function(p){this.projection=(p==="equirect")?"equirect":"flatvr";this.dirty=true;};
  VRViewer.prototype.setContentAngle=function(v){v=+v;if(!isFinite(v))v=120;this.contentAngle=clamp(v,60,360);this.dirty=true;};
  VRViewer.prototype.setLimits=function(opts){opts=opts||{};if(opts.minYaw!=null)this.minYaw=clamp(+opts.minYaw,-180,180);if(opts.maxYaw!=null)this.maxYaw=clamp(+opts.maxYaw,-180,180);if(opts.minPitch!=null)this.minPitch=clamp(+opts.minPitch,-85,85);if(opts.maxPitch!=null)this.maxPitch=clamp(+opts.maxPitch,-85,85);if(this.minYaw>this.maxYaw){var y=this.minYaw;this.minYaw=this.maxYaw;this.maxYaw=y;}if(this.minPitch>this.maxPitch){var p=this.minPitch;this.minPitch=this.maxPitch;this.maxPitch=p;}this.applyLimits();this.dirty=true;};
  VRViewer.prototype.setAutoRotate=function(v){this.autoRotate=!!v;};

  VRViewer.prototype.load=function(src,type,opts){
    var self=this; opts=opts||{};
    if(this.sourceType==="video"&&this.source){try{this.source.pause();}catch(_){}}
    this.source=null; this.sourceType=type||"image"; this.dirty=true;
    return new Promise(function(resolve,reject){
      if(self.sourceType==="video"){
        var v=document.createElement("video");
        v.playsInline=true;
        v.loop=opts.loop!==false;
        v.preload="auto";
        v.muted=opts.audio===false;
        v.volume=opts.volume==null?1:clamp(+opts.volume,0,1);
        v.addEventListener("loadeddata",function(){self.source=v;self.upload();resolve(v);},{once:true});
        v.addEventListener("error",function(){var code=v.error&&v.error.code;reject(new Error("Impossibile caricare il video nel viewer"+(code?" (errore "+code+")":"")));},{once:true});
        v.src=src;
        v.load();
        var pp=v.play();
        if(pp&&typeof pp.catch==="function"){
          pp.catch(function(){
            if(!v.muted){v.muted=true;if(self.onMuteChange)self.onMuteChange(true);v.play().catch(function(){});}
          });
        }
      }else{
        var img=new Image(); img.onload=function(){self.source=img;self.upload();resolve(img);}; img.onerror=function(){reject(new Error("Impossibile caricare l’immagine panoramica"));}; img.src=src;
      }
    });
  };

  VRViewer.prototype.upload=function(){
    if(this.backend!=="webgl") { this.dirty=true; return; }
    var gl=this.gl,s=this.source;if(!s)return;
    gl.bindTexture(gl.TEXTURE_2D,this.texture); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,s); this.dirty=true;
  };
  VRViewer.prototype.getAspect=function(){var s=this.source;if(!s)return 2;if(this.sourceType==="video")return (s.videoWidth||16)/(s.videoHeight||9);return (s.naturalWidth||s.width||2)/(s.naturalHeight||s.height||1);};
  VRViewer.prototype.resize=function(){var dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(this.canvas.clientHeight*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;if(this.gl)this.gl.viewport(0,0,w,h);return true;}return false;};

  VRViewer.prototype.render2d=function(){
    var ctx=this.ctx2d,s=this.source,c=this.canvas;if(!ctx)return;
    ctx.fillStyle="#030812";ctx.fillRect(0,0,c.width,c.height);
    if(!s)return;
    var sw=this.sourceType==="video"?(s.videoWidth||0):(s.naturalWidth||s.width||0);
    var sh=this.sourceType==="video"?(s.videoHeight||0):(s.naturalHeight||s.height||0);
    if(!sw||!sh)return;
    var span=this.projection==="equirect"?360:this.contentAngle;
    var visible=Math.min(span,Math.max(35,this.fov));
    var cropW=sw*(visible/span);
    cropW=Math.max(1,Math.min(sw,cropW));
    var centerNorm=0.5 + (this.yaw-this.baseYaw)/span;
    var sx=centerNorm*sw-cropW/2;
    var wraps=(this.projection==="equirect" || span>=359.5);
    if(wraps){
      while(sx<0)sx+=sw; while(sx>=sw)sx-=sw;
    }else sx=clamp(sx,0,sw-cropW);
    var cropH=Math.min(sh,cropW*(c.height/c.width));
    var sy=clamp((sh-cropH)/2 + (this.pitch-this.basePitch)/90*sh*0.28,0,sh-cropH);
    try{
      if(wraps && sx+cropW>sw){
        var first=sw-sx,firstDst=c.width*(first/cropW);
        ctx.drawImage(s,sx,sy,first,cropH,0,0,firstDst,c.height);
        ctx.drawImage(s,0,sy,cropW-first,cropH,firstDst,0,c.width-firstDst,c.height);
      }else{
        ctx.drawImage(s,sx,sy,cropW,cropH,0,0,c.width,c.height);
      }
    }catch(_){ }
  };

  VRViewer.prototype.render=function(){
    var resized=this.resize();
    if(this.autoRotate&&!this.dragging&&!this.gyro){this.yaw-=0.025;this.applyLimits();this.dirty=true;}
    if(this.backend==="canvas2d"){
      if(this.sourceType==="video" || this.dirty || resized || this.autoRotate) this.render2d();
      this.dirty=false; return;
    }
    var gl=this.gl;if(!gl)return;
    if(this.sourceType==="video"&&this.source&&this.source.readyState>=2){try{this.upload();}catch(_){}}else if(!this.dirty&&!resized&&!this.autoRotate)return;
    gl.useProgram(this.program); gl.uniform2f(this.u.res,this.canvas.width,this.canvas.height); gl.uniform1f(this.u.yaw,rad(this.yaw)); gl.uniform1f(this.u.pitch,rad(this.pitch)); gl.uniform1f(this.u.fov,rad(this.fov)); gl.uniform1f(this.u.proj,this.projection==="equirect"?0:1); gl.uniform1f(this.u.aspectTex,this.getAspect()); gl.uniform1f(this.u.angle,rad(this.contentAngle)); gl.drawArrays(gl.TRIANGLES,0,6); this.dirty=false;
  };

  VRViewer.prototype.start=function(){var self=this;function frame(){self.render();self.raf=requestAnimationFrame(frame);}cancelAnimationFrame(this.raf);frame();};
  VRViewer.prototype.destroy=function(){cancelAnimationFrame(this.raf);this.disableGyro();if(this.sourceType==="video"&&this.source){try{this.source.pause();}catch(_){}}};
  VRViewer.prototype.reset=function(){this.yaw=this.baseYaw;this.pitch=this.basePitch;this.fov=80;this.applyLimits();this.dirty=true;};
  VRViewer.prototype.setLoop=function(v){if(this.sourceType==="video"&&this.source)this.source.loop=!!v;};
  VRViewer.prototype.setMuted=function(v){if(this.sourceType!=="video"||!this.source)return;this.source.muted=!!v;if(this.onMuteChange)this.onMuteChange(this.source.muted);};
  VRViewer.prototype.toggleMuted=function(){if(this.sourceType!=="video"||!this.source)return null;this.setMuted(!this.source.muted);return this.source.muted;};
  VRViewer.prototype.isMuted=function(){return !!(this.sourceType==="video"&&this.source&&this.source.muted);};
  VRViewer.prototype.getBackend=function(){return this.backend;};
  VRViewer.prototype.supportsGyro=function(){return typeof DeviceOrientationEvent!=="undefined";};

  VRViewer.prototype.requestGyro=async function(){
    if(!this.supportsGyro())throw new Error("Sensore di orientamento non disponibile");
    if(typeof DeviceOrientationEvent.requestPermission==="function"){
      var p=await DeviceOrientationEvent.requestPermission();if(p!=="granted")throw new Error("Permesso non concesso");
    }
    this.gyroZero=null;window.addEventListener("deviceorientation",this._orientationHandler,true);this.gyro=true;this.dirty=true;
  };
  VRViewer.prototype.disableGyro=function(){window.removeEventListener("deviceorientation",this._orientationHandler,true);this.gyro=false;this.gyroZero=null;};
  VRViewer.prototype.onOrientation=function(e){if(e.alpha==null||e.beta==null)return;if(!this.gyroZero)this.gyroZero={alpha:e.alpha,beta:e.beta};var da=e.alpha-this.gyroZero.alpha;if(da>180)da-=360;if(da<-180)da+=360;this.yaw=this.baseYaw-da;this.pitch=this.basePitch+(e.beta-this.gyroZero.beta);this.applyLimits();this.dirty=true;};

  window.VRViewer=VRViewer;
})();
