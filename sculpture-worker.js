import * as THREE from 'three';
import {createMonogramGeometry,createMonogramParts} from './monogram-geometry.js';
import {ASSEMBLY_DURATION,assemblyState,flightEase} from './assembly-timeline.js';

let renderer,scene,camera,geometry,material,flatMaterial,environment,group,sculpture,parts,ambient,key,rim,sweep;
let width=1,height=1,pixelRatio=1,visible=false,reduced=false,paused=false,dragging=false,ready=false;
let rotation=0,targetX=.16,targetY=-.32,currentX=.16,currentY=-.32,hoverX=0,hoverY=0;
let assemblyTime=0,lastPhase=null,frame=null,previousTime=0,lastRendered=0,slowFrames=0,quality=1;
let frameInterval=1000/30;
const pathPoint=new THREE.Vector3();
const flatColor=new THREE.Color('#ff6444'),metalColor=new THREE.Color('#7c827b');
const requestFrame=callback=>self.requestAnimationFrame?self.requestAnimationFrame(callback):setTimeout(()=>callback(performance.now()),frameInterval);
const cancelFrame=id=>self.cancelAnimationFrame?self.cancelAnimationFrame(id):clearTimeout(id);

function assemble(){
  const state=assemblyState(assemblyTime);
  if(state.phase!==lastPhase){
    sculpture.visible=state.phase!=='flight';sculpture.material=state.phase==='flat'?flatMaterial:material;
    parts.forEach(part=>{part.mesh.visible=state.phase==='flight';});
    self.postMessage({type:'phase',phase:state.phase,complete:state.complete});lastPhase=state.phase;
  }
  for(let index=0;index<parts.length;index++){
    const part=parts[index],progress=state.flights[index],eased=flightEase(progress);
    if(state.phase==='flight'){
      part.curve.getPoint(eased,pathPoint);part.mesh.position.copy(part.pivot).add(pathPoint);part.mesh.rotation.set(0,0,part.spin*(1-eased));
    }
    for(const trail of part.trails){
      trail.mesh.visible=state.phase==='flight' && progress>.08 && progress<.98;if(!trail.mesh.visible)continue;
      const lagged=flightEase(progress-trail.lag);
      part.curve.getPoint(lagged,pathPoint);trail.mesh.position.copy(part.pivot).add(pathPoint);
      trail.mesh.rotation.set(0,0,part.spin*(1-lagged));trail.mesh.material.opacity=trail.opacity*Math.sin(progress*Math.PI);
    }
  }
  sculpture.scale.z=THREE.MathUtils.lerp(.012,1,state.depth);
  material.color.copy(flatColor).lerp(metalColor,state.light);material.emissive.copy(flatColor);material.emissiveIntensity=.85*(1-state.light);
  material.metalness=state.light;material.roughness=THREE.MathUtils.lerp(1,.23,state.light);material.envMapIntensity=1.15*state.light;
  ambient.intensity=.5*state.light;key.intensity=3*state.light;rim.intensity=2*state.light;
  sweep.intensity=state.sweep>0 && state.sweep<1?95*Math.sin(state.sweep*Math.PI):0;
  sweep.position.x=THREE.MathUtils.lerp(-3.6,3.6,state.sweep);sweep.target.position.set(sweep.position.x-.4,0,0);
  group.scale.set(1+state.impact,1-state.impact*.65,1);
  group.rotation.set((currentX+hoverY)*state.depth,(currentY+Math.sin(rotation)*.22+hoverX)*state.depth,-.08*state.depth);
}
function render(){if(!ready)return;assemble();renderer.render(scene,camera);}
function resize(){
  if(!renderer)return;
  const scale=Math.min(1,1000/(Math.max(width,height)*pixelRatio))*quality;
  renderer.setSize(Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale)),false);camera.aspect=width/height;
  const halfFov=THREE.MathUtils.degToRad(camera.fov/2);
  camera.position.z=geometry.boundingSphere.radius/Math.sin(Math.min(halfFov,Math.atan(Math.tan(halfFov)*camera.aspect)))*1.12;
  camera.updateProjectionMatrix();if(visible)render();
}
function stop(){if(frame!==null)cancelFrame(frame);frame=null;previousTime=0;}
function tick(time){
  frame=null;if(!visible || !ready)return;
  if(time-lastRendered<frameInterval){frame=requestFrame(tick);return;}
  lastRendered=time;const elapsed=previousTime?Math.max(0,(time-previousTime)/1000):0;
  previousTime=time;const delta=Math.min(elapsed,.05);
  if(!paused && !reduced){if(assemblyTime<ASSEMBLY_DURATION)assemblyTime=Math.min(ASSEMBLY_DURATION,assemblyTime+elapsed);else if(!dragging)rotation+=delta*.38;}
  const ease=1-Math.exp(-delta*8);currentX+=(targetX-currentX)*ease;currentY+=(targetY-currentY)*ease;
  const start=performance.now();render();slowFrames=performance.now()-start>45?slowFrames+1:0;
  if(slowFrames>=3 && quality>.5){quality*=.75;frameInterval=1000/24;slowFrames=0;resize();}
  if(!reduced && (!paused || Math.abs(targetX-currentX)+Math.abs(targetY-currentY)>.001))frame=requestFrame(tick);
}
function sync(){stop();if(!ready || !visible)return;if(reduced)assemblyTime=ASSEMBLY_DURATION;if(!reduced && !paused)frame=requestFrame(tick);else render();}
function inputRender(){if(reduced || paused){currentX=targetX;currentY=targetY;render();}else if(frame===null && visible)frame=requestFrame(tick);}
async function initialize(data){
  width=Math.max(1,data.width);height=Math.max(1,data.height);visible=data.visible;reduced=data.reduced;
  pixelRatio=Math.min(data.pixelRatio,data.compact?1:1.25);frameInterval=1000/(data.compact?24:30);
  renderer=new THREE.WebGLRenderer({canvas:data.canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(pixelRatio);renderer.setClearColor(0x101211,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.1,40);
  const studio=new THREE.Scene();studio.background=new THREE.Color('#252321');
  for(const [w,h,color,intensity,position] of [
    [3,9,'#f4f6ed',5,[-4,2,4]],[2,8,'#ecf0e6',3,[5,1,2]],[7,2,'#ffffff',4,[0,6,1]],
    [1.5,7,'#ff7955',3,[-3,-1,-3]],[3,4,'#f05b3c',2,[4,-2,-2]],[5,1,'#e5ebdc',2,[0,-5,3]]
  ]){
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide}));
    mesh.position.set(...position);mesh.lookAt(0,0,0);studio.add(mesh);
  }
  const pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromScene(studio,0,.1,100,{size:64});scene.environment=environment.texture;pmrem.dispose();
  studio.traverse(object=>{if(object.isMesh){object.geometry.dispose();object.material.dispose();}});
  geometry=createMonogramGeometry();material=new THREE.MeshPhysicalMaterial({color:'#7c827b',metalness:1,roughness:.23,clearcoat:.65,clearcoatRoughness:.17,envMapIntensity:1.15,side:THREE.DoubleSide});
  flatMaterial=new THREE.MeshBasicMaterial({color:flatColor,side:THREE.DoubleSide,toneMapped:false});
  sculpture=new THREE.Mesh(geometry,material);group=new THREE.Group();group.add(sculpture);scene.add(group);
  const specs=[{path:[[-7,-1.8,0],[-2.7,3.2,0],[-1.3,.9,0],[0,0,0]],spin:-2.2},
    {path:[[2.2,7,0],[-3.4,4.3,0],[.8,1.2,0],[0,0,0]],spin:2.8},
    {path:[[7,-2.4,0],[3.7,-3.2,0],[1.3,-.9,0],[0,0,0]],spin:2.1}];
  parts=createMonogramParts(geometry).map((part,index)=>{
    const mesh=new THREE.Mesh(part.geometry,flatMaterial);mesh.position.copy(part.pivot);mesh.scale.z=.012;mesh.renderOrder=2;group.add(mesh);
    const trails=[.04,.085].map((lag,i)=>{
      const trail=new THREE.Mesh(part.geometry,new THREE.MeshBasicMaterial({color:flatColor,side:THREE.DoubleSide,toneMapped:false,transparent:true,opacity:0,depthWrite:false}));
      trail.scale.z=.01;trail.renderOrder=1;group.add(trail);return {mesh:trail,lag,opacity:i===0?.13:.045};
    });
    return {...part,...specs[index],mesh,trails,curve:new THREE.CubicBezierCurve3(...specs[index].path.map(p=>new THREE.Vector3(...p)))};
  });
  ambient=new THREE.HemisphereLight(0xe5ecd9,0x192112,.5);scene.add(ambient);
  key=new THREE.DirectionalLight(0xf2f5ea,3);key.position.set(-3,5,4);scene.add(key);
  rim=new THREE.DirectionalLight(0xff7955,2);rim.position.set(3,-1,-3);scene.add(rim);
  sweep=new THREE.SpotLight(0xffe3d1,0,25,.18,.75,1.5);sweep.position.set(-4,2.8,5);scene.add(sweep,sweep.target);
  await renderer.compileAsync(scene,camera);assemblyTime=reduced?ASSEMBLY_DURATION:0;ready=true;resize();self.postMessage({type:'ready'});sync();
  data.canvas.addEventListener('webglcontextlost',()=>{stop();self.postMessage({type:'error',message:'WebGL context lost'});});
}
self.onmessage=({data})=>{
  if(data.type==='init'){initialize(data).catch(error=>self.postMessage({type:'error',message:error.message}));return;}
  if(data.type==='visibility'){visible=data.visible;sync();return;}
  if(data.type==='resize'){width=Math.max(1,data.width);height=Math.max(1,data.height);if(ready)resize();return;}
  if(!ready)return;
  if(data.type==='pointer'){
    if(data.dx!==undefined){targetY+=data.dx*.009;targetX=THREE.MathUtils.clamp(targetX+data.dy*.009,-1.5,1.5);hoverX=hoverY=0;}else{hoverX=data.x*.18;hoverY=data.y*.12;}inputRender();
  }else if(data.type==='key'){
    const changes={ArrowLeft:[0,-.15],ArrowRight:[0,.15],ArrowUp:[-.15,0],ArrowDown:[.15,0],step:[0,Math.PI/6]};
    const change=changes[data.key];if(change){targetX=THREE.MathUtils.clamp(targetX+change[0],-1.5,1.5);targetY+=change[1];inputRender();}
  }else if(data.type==='drag'){dragging=data.dragging;}
  else if(data.type==='pause'){paused=data.paused;sync();}
  else if(data.type==='reduced'){reduced=data.reduced;sync();}
  else if(data.type==='replay'){assemblyTime=rotation=0;targetX=currentX=.16;targetY=currentY=-.32;hoverX=hoverY=0;paused=false;sync();}
  else if(data.type==='reset'){targetX=.16;targetY=-.32;rotation=hoverX=hoverY=0;inputRender();}
};
