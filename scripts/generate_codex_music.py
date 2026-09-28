"""Original deterministic 120 BPM cue. Run with Python + NumPy; writes stems and cue map."""
from pathlib import Path
import numpy as np, wave, json
OUT=Path(__file__).resolve().parents[1]/'public'/'audio'/'codex-stems';OUT.mkdir(parents=True,exist_ok=True)
SR=48000;DUR=30.6;N=round(SR*DUR);rng=np.random.RandomState(270927)
stems={k:np.zeros((N,2),dtype=np.float64) for k in ['drums','bass','chords','melody','foley']}
def add(bus,start,x,gain=1,pan=0):
    idx=round(start*SR); lo=max(0,idx);hi=min(N,idx+len(x))
    if hi>lo:stems[bus][lo:hi]+=x[lo-idx:hi-idx,None]*gain*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])
def tone(midi,dur,decay=4,kind='bell'):
    t=np.arange(round(dur*SR))/SR;f=440*2**((midi-69)/12)
    env=(1-np.exp(-t*350))*np.exp(-t*decay)*np.minimum(1,(dur-t)*60)
    x=np.sin(2*np.pi*f*t)
    if kind=='bell':x+=.28*np.sin(2*np.pi*f*2*t)*np.exp(-t*5)+.12*np.sin(2*np.pi*f*3*t)*np.exp(-t*8)
    elif kind=='bass':x+=.25*np.sin(2*np.pi*f*2*t)+.09*np.sin(2*np.pi*f*3*t)
    return x*env
def noise(dur,decay):
    t=np.arange(round(dur*SR))/SR;n=rng.normal(0,1,len(t));n=np.r_[0,np.diff(n)]
    return n*np.exp(-t*decay)*np.minimum(1,t*1200)
# 4/4 groove: kick + clap backbeat, swung offbeat hats, small phrase fills.
for beat in range(61):
    at=beat*.5;t=np.arange(round(.28*SR))/SR
    kick=np.sin(2*np.pi*(48*t+95*.024*(1-np.exp(-t/.024))))*np.exp(-t*16)
    if not 24<=at<25.5:add('drums',at,kick,.6)
    if beat%2==1 and not 24<=at<25.5:
        add('drums',at,noise(.16,32),.12)
        add('drums',at+.017,noise(.12,42),.06)
    for off in [0,.27]:
        if at+off<30:add('drums',at+off,noise(.065 if off==0 else .12,65 if off==0 else 34),.035 if off==0 else .06,(-1 if beat%2 else 1)*.32)
    if beat%8==7:
        for off in [.25,.375]:add('drums',at+off,tone(50,.1,30,'bass'),.14)
chords=[[57,60,64,67],[53,57,60,64],[60,64,67,71],[55,59,62,65]]
roots=[33,29,36,31]
for bar in range(15):
    chord=chords[bar%4];root=roots[bar%4];at=bar*2
    for off in [0,.75,1.5]:
        for j,m in enumerate(chord):add('chords',at+off,tone(m+12,.52,6),.065,[-.55,-.2,.2,.55][j])
    for off,step in [(0,0),(.75,0),(1,12),(1.75,7)]:add('bass',at+off,tone(root+step,.30,7,'bass'),.30)
    motif=[0,2,1,3,2,1]
    for j,off in enumerate([.25,.5,.875,1.25,1.5,1.75]):
        midi=chord[motif[j]]+24
        add('melody',at+off,tone(midi,.42,8),.085 if bar<10 else .12,np.sin(j)*.35)
        add('melody',at+off+.1875,tone(midi,.32,10),.027,-np.sin(j)*.5)
cues=[(1.25,'drop'),(1.81,'drop'),(2.37,'drop'),(2.93,'drop'),(6,'cut'),(8,'transition'),(10,'glitch'),(11,'title'),(13.35,'undo'),(16.6,'too-much'),(18.3,'correct'),(20.5,'beat-align'),(23.5,'export'),(25.5,'success')]
for i,(at,name) in enumerate(cues):
    if name in ['transition','undo','export']:
        t=np.arange(round(.2*SR))/SR
        sweep=np.sin(2*np.pi*(420*t+(1400 if name!='undo' else -700)*t*t))*np.sin(np.pi*t/.2)**2
        add('foley',at-.18,sweep,.08)
    add('foley',at,tone(76 if name!='too-much' else 63,.24,17),.20)
    if name in ['cut','glitch']:add('foley',at,noise(.07,65),.1)
    if name in ['correct','beat-align','success']:
        for j,m in enumerate([76,79,84]):add('foley',at+j*.09,tone(m,.65,5),.16, j*.2-.2)
for j,m in enumerate([69,72,76,81]):add('chords',30,tone(m,.6,4),.12)
mix=sum(stems.values());fade=np.minimum(1,np.arange(N)/240)*np.minimum(1,np.maximum(0,(N-1-np.arange(N)))/(SR*.45))
scale=.88/max(1,float(np.max(np.abs(mix))))
def save(name,x):
    x=x*fade[:,None]*scale
    with wave.open(str(OUT/name),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(x,-1,1)*32767).astype('<i2').tobytes())
    return {'peakDbFS':float(20*np.log10(max(1e-9,np.max(np.abs(x))))),'rmsDbFS':float(20*np.log10(max(1e-9,np.sqrt(np.mean(x*x)))))}
for name,x in stems.items():save('v2-'+name+'.wav',x)
stats=save('v2-groove-mix.wav',mix)
(OUT/'v2-cue-map.json').write_text(json.dumps({'bpm':120,'sampleRate':SR,'seconds':DUR,'seed':270927,'source':'Original procedural score; no reference audio samples','events':[{'seconds':t,'frame':round(t*30),'event':n} for t,n in cues],**stats},indent=2),encoding='utf-8')
print(json.dumps(stats))

import shutil
shutil.copyfile(OUT/'v2-groove-mix.wav', OUT.parent/'codex.wav')
