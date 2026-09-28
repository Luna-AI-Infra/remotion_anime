// Shared content state: layout, playhead, header clock and phone use these values.
const ease=(x:number)=>{const p=Math.max(0,Math.min(1,x));return p*p*p*(10+p*(-15+6*p));};
export const drops=[1.25,1.81,2.37,2.93];
export const clipsAt=(t:number)=>{
 const trim=ease((t-6)/.65); let start=0;
 return [3.5,3.74-trim,3.5,4].map((duration,kind)=>{
  const clip={kind,start,duration,drop:drops[kind],x:156+100*start,width:100*duration};start+=duration;return clip;
 });
};
export const playbackAt=(t:number)=>{
 const clips=clipsAt(t);
 let selected=0,age=0;
 if(t<4){for(let i=0;i<4;i++)if(t>=drops[i]){selected=i;age=t-drops[i];}}
 else if(t<7){selected=1;age=.6+(t-4)*.63;}
 else if(t<10.5){selected=0;age=t-7;}
 else if(t<14.5){selected=2;age=(t-10.5)%3.5;}
 else {selected=3;age=(t-14.5)%4;}
 const c=clips[selected];
 const position=c.start+Math.min(c.duration-1/300,Math.max(0,age));
 const hit=clips.find(c=>position>=c.start && position<c.start+c.duration)!;
 return {position,x:156+position*100,kind:hit.kind,localTime:position-hit.start,ready:t>=drops[0]};
};
