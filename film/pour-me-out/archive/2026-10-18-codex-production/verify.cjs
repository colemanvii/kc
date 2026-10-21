const fs=require('fs'),crypto=require('crypto'),path=require('path'),assert=require('assert');const motion=require('./motion');
const root=path.resolve(__dirname,'..'),baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline-sha256.json')));
for(const [file,hash]of Object.entries(baseline))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file+' changed');
// Compare extracted transforms with the source baseline formula at every output frame and endpoint.
for(let f=0;f<=120;f++){const p=f/120,z=p*p*(3-2*p),s=motion.sample(f/24);for(let k=0;k<4;k++){const base=.50+k*.13,w=740*(base+(.53+k*.14-base)*z),x=760-w/2+z*6*(3-k);const a=s.planes[k];assert(Math.abs((760-740*base/2-760)*a.scale+760+a.translateX-x)<1e-9)}assert(Math.abs(390+s.curtainTranslateX-(390-95*z))<1e-9)}
const out={baselineFilesUnchanged:Object.keys(baseline).length,cameraSamplesMatched:121,status:'passed',actualArtworkIntegration:'pending approved asset files'};fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(out,null,2));console.log(out);
