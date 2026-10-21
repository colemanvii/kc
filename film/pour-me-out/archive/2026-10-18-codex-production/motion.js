/* Locked to pour-me-out-previs/index.html reveal(). Asset registration is separate. */
(function(root){
const clamp=x=>Math.max(0,Math.min(1,x));
function sample(seconds){const p=clamp(seconds/5),z=p*p*(3-2*p);
return {seconds:clamp(seconds/5)*5,eased:z,planes:[0,1,2,3].map(k=>{
 const start=.50+k*.13,end=.53+k*.14,size=start+(end-start)*z;
 return {id:k,scale:size/start,translateX:z*6*(3-k),pivotX:760,pivotY:340};
}),curtainTranslateX:-95*z,characterScale:1};}
const api=Object.freeze({duration:5,fps:24,width:1280,height:720,sample});
if(typeof module!=='undefined')module.exports=api;else root.RevealMotion=api;
})(typeof window==='undefined'?globalThis:window);
