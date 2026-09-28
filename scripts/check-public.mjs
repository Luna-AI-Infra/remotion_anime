// Run after git add. Check the exact staged publication, not ignored local files.
import {execFileSync} from 'node:child_process';
const files=execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACMR','-z']).toString().split('\0').filter(Boolean);
const patterns=[/[A-Za-z]:[\\/](?:Users|codexWorkspace|home)[\\/]/i,/\b192\.168\.\d+\.\d+\b/,/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,/\bsk-[A-Za-z0-9_-]{20,}\b/,/\bgh[pousr]_[A-Za-z0-9]{20,}\b/,/\b[A-Za-z0-9._%+-]+@(?:gmail|outlook|hotmail|qq|163)\.com\b/i];
let failures=0;
for(const file of files){
 if(/(^|\/)(?:\.env|\.claude|\.codex)(?:\/|$)|\.jsonl$|(?:^|\/)id_(?:rsa|ed25519)$/.test(file)){console.error('Forbidden file:',file);failures++;continue;}
 if(file==='scripts/check-public.mjs')continue;
 const data=execFileSync('git',['show',`:${file}`],{maxBuffer:40*1024*1024});
 if(data.includes(0))continue;
 if(patterns.some(p=>p.test(data.toString('utf8')))){console.error('Review sensitive pattern in:',file);failures++;}
}
if(failures)process.exit(1);
console.log(`Staged publication check: ${files.length} files; no matched private paths, personal emails or credential patterns. Manual review still required.`);
