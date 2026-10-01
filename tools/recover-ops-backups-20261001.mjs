// User-approved recovery: archive seven exact obsolete OPS backups locally first.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const names=['ops-before-data-20260924','ops-before-data-20260924-retry1','ops-before-data-20260925','ops-before-data-20260926','ops-before-data-20260927','ops-before-data-20260928','ops-before-data-20260929'];
const retained=['ops-before-data-20260930','ops-before-app-sales-20260930','ops-before-noesis-20261001'];
const root='/srv/wonderelian/backups';
const destination='/Users/yongyuan/Documents/ChatGPT/运营推广/ops/recovery/ops-old-backups-20261001';
const keys=fs.readdirSync('/Users/yongyuan/.ssh').filter(n=>/ali/i.test(n)).map(n=>'/Users/yongyuan/.ssh/'+n).filter(p=>fs.statSync(p).isFile()&&(fs.statSync(p).mode&0o777)===0o600&&fs.readFileSync(p,'utf8').includes('PRIVATE KEY'));
if(keys.length!==1)throw new Error('Dedicated SSH configuration is not unique');
const ssh=['-i',keys[0],'-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','root@8.130.104.221'];
function remote(script,extra={}){const r=spawnSync('ssh',[...ssh,script],{encoding:'utf8',timeout:60000,maxBuffer:8000000,...extra});if(r.status!==0)throw new Error('Bounded remote operation failed');return r.stdout;}
const manifestCode=`import os,json,hashlib\nroot=${JSON.stringify(root)}\nnames=${JSON.stringify(names)}\nresult={}\nfor name in names:\n p=root+'/'+name\n assert os.path.isdir(p) and os.path.realpath(p)==p\n for base,dirs,files in os.walk(p):\n  for item in dirs+files: assert not os.path.islink(base+'/'+item)\n  for item in files:\n   f=base+'/'+item\n   result[os.path.relpath(f,root)]=hashlib.sha256(open(f,'rb').read()).hexdigest()\nprint(json.dumps(result,sort_keys=True))`;
const manifestCommand=`python3 - <<'PY'\n${manifestCode}\nPY`;
fs.mkdirSync(path.dirname(destination),{recursive:true});
if(!fs.existsSync(destination))fs.mkdirSync(destination,{recursive:false});
const original=remote(manifestCommand),manifest=JSON.parse(original);
const manifestPath=path.join(destination,'manifest.json');
if(fs.existsSync(manifestPath)&&fs.readFileSync(manifestPath,'utf8')!==original)throw new Error('Existing recovery manifest differs');
fs.writeFileSync(manifestPath,original);
const archive=path.join(destination,'backups.tar.gz');
if(!fs.existsSync(archive)){
 const fd=fs.openSync(archive,'wx');
 try{remote(`tar -czf - -C '${root}' ${names.map(n=>`'${n}'`).join(' ')}`,{stdio:['ignore',fd,'pipe']});}finally{fs.closeSync(fd);}
}
// Parse archive directly: macOS tar consumes AppleDouble files during extraction.
// Direct member hashing verifies those original Linux files as well.
const verify=spawnSync('python3',['-c',`import tarfile,json,hashlib,sys\nm=json.load(open(sys.argv[2]))\nwith tarfile.open(sys.argv[1]) as t:\n files={x.name:x for x in t.getmembers() if x.isfile()}\n assert set(files)==set(m)\n for name,expected in m.items(): assert hashlib.sha256(t.extractfile(files[name]).read()).hexdigest()==expected\nprint('ARCHIVE_ALL_MEMBER_HASHES_VERIFIED')`,archive,manifestPath],{encoding:'utf8',timeout:60000});
if(verify.status!==0)throw new Error('Recovery archive member hash mismatch');
console.log(verify.stdout.trim());
if(remote(manifestCommand)!==original)throw new Error('Remote backups changed during archiving');
const deletion=`import os,shutil,json\nroot=${JSON.stringify(root)}\nnames=${JSON.stringify(names)}\nretained=${JSON.stringify(retained)}\nfor name in retained: assert os.path.isdir(root+'/'+name)\nfor name in names:\n p=root+'/'+name\n assert name.startswith('ops-before-data-202609') and os.path.dirname(p)==root and os.path.realpath(p)==p\n shutil.rmtree(p)\nprint('REMOVED_EXACT_OLD_OPS_BACKUPS',len(names))`;
console.log(remote(`python3 - <<'PY'\n${deletion}\nPY\ndf -Pk /srv/wonderelian/ops.wonderelian.com\nstat -f -c 'free_blocks=%f available_blocks=%a block_size=%S' /srv/wonderelian/ops.wonderelian.com`));
const sha=createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
console.log(JSON.stringify({archive,sha256:sha,files_verified:Object.keys(manifest).length,removed:names,retained}));
