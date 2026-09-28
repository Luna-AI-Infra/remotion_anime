import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mode=process.argv[2]??'all';
if(!['all','codex','deepseek','stills'].includes(mode))throw Error('Use all, codex, deepseek, or stills');
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public')});
await mkdir(path.join(root,'out'),{recursive:true});
await mkdir(path.join(root,'docs/images'),{recursive:true});
for(const [name,id] of [['codex','CodexWorkbench'],['deepseek','DeepSeekWorkbench']]){
 if(mode!== 'all' && mode!=='stills' && mode!==name)continue;
 const composition=await selectComposition({serveUrl,id});
 if(mode==='stills'){
  for(const frame of [90,330,510,795])await renderStill({serveUrl,composition,frame,output:path.join(root,`docs/images/${name}-${frame}.png`)});
 }else{
  let last=-1;
  await renderMedia({serveUrl,composition,codec:'h264',crf:16,pixelFormat:'yuv420p',audioCodec:'aac',audioBitrate:'320k',concurrency:4,outputLocation:path.join(root,`out/${name}-v4.mp4`),onProgress:({progress})=>{const n=Math.floor(progress*10);if(n!==last){last=n;console.log(`${name}: ${n*10}%`);}}});
 }
 console.log(`${name}: done`);
}
