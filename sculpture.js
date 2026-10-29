// Three.js, geometry, reflections and rendering run in a dedicated worker.
export async function initializeSculpture() {
  const host=document.querySelector('.hero-art');
  let canvas=document.querySelector('#sculpture-canvas');
  const controls=document.querySelector('.sculpture-controls');
  const pause=document.querySelector('#sculpture-pause');
  const replay=document.querySelector('#sculpture-assemble');
  const reset=document.querySelector('#sculpture-reset');
  const instruction=document.querySelector('#sculpture-instruction');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!canvas.transferControlToOffscreen || !window.Worker){
    return (await import('./sculpture-main.js')).initializeSculpture();
  }
  const worker=new Worker(SCULPTURE_WORKER_URL,{type:'module',name:'noxum-sculpture'});
  const events=new AbortController();
  const on=(target,type,handler)=>target.addEventListener(type,handler,{signal:events.signal});
  let ready=false,visible=false,paused=false,complete=false,dragging=false,lastPointer;
  let pointerFrame=null,pointer;
  const send=(type,data={})=>worker.postMessage({type,...data});
  const visibility=()=>send('visibility',{visible:visible && !document.hidden});
  const resize=()=>{const rect=host.getBoundingClientRect();send('resize',{width:rect.width,height:rect.height});};
  const resizeObserver=new ResizeObserver(resize);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visibility();});
  const stop=()=>{
    events.abort();resizeObserver.disconnect();observer.disconnect();
    if(pointerFrame!==null)cancelAnimationFrame(pointerFrame);
    worker.terminate();
  };
  const unavailable=()=>{
    stop();host.classList.remove('is-3d','is-assembling');host.removeAttribute('aria-busy');controls.hidden=true;
    const replacement=canvas.cloneNode();canvas.replaceWith(replacement);canvas=replacement;
  };
  on(canvas,'pointerdown',event=>{
    if(!complete || (event.pointerType==='mouse' && event.button!==0))return;
    dragging=true;send('drag',{dragging:true});lastPointer={x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');
  });
  on(canvas,'pointermove',event=>{
    if(!complete)return;
    if(dragging && lastPointer){
      pointer={dx:(pointer?.dx||0)+event.clientX-lastPointer.x,dy:(pointer?.dy||0)+event.clientY-lastPointer.y};
      lastPointer={x:event.clientX,y:event.clientY};
    }else if(event.pointerType==='mouse' && !reduced.matches){
      const rect=canvas.getBoundingClientRect();pointer={x:(event.clientX-rect.left)/rect.width-.5,y:(event.clientY-rect.top)/rect.height-.5};
    }else return;
    if(pointerFrame!==null)return;
    pointerFrame=requestAnimationFrame(()=>{send('pointer',pointer);pointer=null;pointerFrame=null;});
  });
  const release=()=>{dragging=false;send('drag',{dragging:false});lastPointer=null;canvas.classList.remove('is-dragging');};
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>on(canvas,type,release));
  on(canvas,'pointerleave',()=>{if(!dragging)send('pointer',{x:0,y:0});});
  on(canvas,'keydown',event=>{
    if(!complete || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();send('key',{key:event.key});
  });
  on(pause,'click',()=>{
    if(reduced.matches){send('key',{key:'step'});return;}
    paused=!paused;send('pause',{paused});pause.setAttribute('aria-pressed',String(paused));
    pause.textContent=paused?'Reanudar':'Pausar animación';
  });
  on(replay,'click',()=>{paused=false;complete=false;send('replay');pause.setAttribute('aria-pressed','false');pause.textContent='Pausar animación';});
  on(reset,'click',()=>send('reset'));
  on(document,'visibilitychange',visibility);
  on(reduced,'change',()=>{
    send('reduced',{reduced:reduced.matches});replay.hidden=reduced.matches;
    if(reduced.matches)pause.removeAttribute('aria-pressed');else pause.setAttribute('aria-pressed',String(paused));
    pause.textContent=reduced.matches?'Girar un paso':paused?'Reanudar':'Pausar animación';
  });
  on(window,'pagehide',event=>{if(event.persisted)send('visibility',{visible:false});else stop();});
  on(window,'pageshow',event=>{if(event.persisted){resize();visibility();}});
  const initialized=new Promise((resolve,reject)=>{
    worker.onerror=()=>{unavailable();reject(new Error('No se pudo iniciar el hilo 3D'));};
    worker.onmessage=({data})=>{
      if(data.type==='ready'){
        ready=true;host.classList.add('is-3d');controls.hidden=false;replay.hidden=reduced.matches;
        pause.textContent=reduced.matches?'Girar un paso':'Pausar animación';
        if(reduced.matches)pause.removeAttribute('aria-pressed');
        resize();visibility();resolve();
      }else if(data.type==='phase'){
        complete=data.complete;host.setAttribute('aria-busy',String(!complete));host.classList.toggle('is-assembling',!complete);
        instruction.textContent=complete?'Arrastra para girar':data.phase==='reveal'?'Revelando el metal…':'Ensamblando la N…';
      }else if(data.type==='error'){
        unavailable();if(!ready)reject(new Error(data.message));
        else{const launch=document.querySelector('#sculpture-launch');launch.hidden=false;launch.disabled=false;launch.textContent='Reintentar 3D';}
      }
    };
  });
  const rect=host.getBoundingClientRect(),offscreen=canvas.transferControlToOffscreen();
  worker.postMessage({type:'init',canvas:offscreen,width:rect.width,height:rect.height,pixelRatio:devicePixelRatio||1,
    compact:matchMedia('(max-width:999px)').matches,reduced:reduced.matches,
    visible:rect.bottom>0 && rect.top<innerHeight && !document.hidden},[offscreen]);
  resizeObserver.observe(host);observer.observe(host);
  return initialized;
}
