'use strict';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),statusEl=document.querySelector('#status'),play=document.querySelector('#play'),seek=document.querySelector('#seek');
let assets=[],playing=false,t=0,last=0,generation=0;
const expected=[['room','plane3'],['near','plane0'],['curtain','curtain'],['character','character']];
function validateManifest(m){
 if(m.canvas?.width!==2560||m.canvas?.height!==1440)throw Error('Package must use registered 2560 × 1440 canvases.');
 for(const key of ['environmentApproval','characterApproval'])if(m[key]?.approved!==true||!m[key]?.reference?.trim())throw Error(`${key}: recorded approval reference is required.`);
 if(m.characterApproval.author!=='Jim')throw Error('Character provenance must identify Jim.');
 if(!Array.isArray(m.layers)||m.layers.length!==4)throw Error('Exactly four registered layers are required.');
 expected.forEach(([id,motion],i)=>{const l=m.layers[i];if(l.id!==id||l.motion!==motion||!/^[^/\\]+\.png$/i.test(l.file))throw Error(`Layer ${i+1} must be ${id}, motion ${motion}, with a local PNG filename.`)});
 if(new Set(m.layers.map(l=>l.file)).size!==4)throw Error('Each layer must have its own file.');return true;
}
function clear(){assets.forEach(a=>a.image.close());assets=[];playing=false;play.textContent='Play';play.disabled=seek.disabled=true;ctx.clearRect(0,0,1280,720);t=0;seek.value=0;document.querySelector('#time').value='0.00 / 5.00s'}
async function load(files){const gen=++generation;clear();let loaded=[];try{
 const names=new Map();for(const f of files){if(names.has(f.name))throw Error('Duplicate filename: '+f.name);names.set(f.name,f)}
 const manifests=files.filter(f=>f.name.endsWith('.json'));if(manifests.length!==1)throw Error('Select exactly one JSON approval manifest and the four PNG layers.');
 const m=JSON.parse(await manifests[0].text());validateManifest(m);
 for(const l of m.layers){const f=names.get(l.file);if(!f)throw Error('Missing: '+l.file);const image=await createImageBitmap(f);loaded.push({...l,image});if(image.width!==2560||image.height!==1440)throw Error(`${l.file}: expected 2560 × 1440, got ${image.width} × ${image.height}.`)}
 if(gen!==generation){loaded.forEach(a=>a.image.close());return}
 assets=loaded;loaded=[];play.disabled=seek.disabled=false;statusEl.textContent='Package decoded. Approval references recorded. Review visual registration, alpha edges, and source fidelity before final export.';draw(0);
 }catch(e){loaded.forEach(a=>a.image.close());if(gen===generation){clear();statusEl.textContent='Asset hold: '+e.message}}
}
function draw(seconds){if(assets.length!==4)return;const s=RevealMotion.sample(seconds);t=s.seconds;ctx.clearRect(0,0,1280,720);
 for(const a of assets){ctx.save();if(a.motion.startsWith('plane')){const p=s.planes[Number(a.motion.slice(5))];ctx.translate(p.pivotX+p.translateX,p.pivotY);ctx.scale(p.scale,p.scale);ctx.translate(-p.pivotX,-p.pivotY)}else if(a.motion==='curtain')ctx.translate(s.curtainTranslateX,0);ctx.drawImage(a.image,0,0,1280,720);ctx.restore()}
 seek.value=t;document.querySelector('#time').value=`${t.toFixed(2)} / 5.00s`;
}
document.querySelector('#files').onchange=e=>load(Array.from(e.target.files));seek.oninput=()=>draw(Number(seek.value));play.onclick=()=>{if(t>=5)draw(0);playing=!playing;play.textContent=playing?'Pause':'Play';last=performance.now()};
function tick(now){if(playing){draw(t+(now-last)/1000);if(t>=5){playing=false;play.textContent='Play'}}last=now;requestAnimationFrame(tick)}requestAnimationFrame(tick);
window.RevealScene={validateManifest,load,draw,state:()=>({ready:assets.length===4,time:t,playing})};
