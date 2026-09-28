import React from 'react';
import {staticFile,useCurrentFrame} from 'remotion';
import {clipsAt,playbackAt} from './playback';

// All motion is a pure projection of time. Feet, wrists and UI handles share coordinates.
const C={ink:'#263b34',paper:'#f4eddc',white:'#fff9e9',green:'#447c65',mint:'#9dccac',screen:'#173f34',yellow:'#edcc76',coral:'#d98877',violet:'#a59dcb',muted:'#7e8c7c'};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const p=clamp(x);return p*p*p*(10+p*(-15+6*p));};
const prog=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const between=(t:number,a:number,b:number)=>t>=a&&t<b;
const pop=(t:number,a:number,d=.65)=>{const x=Math.max(0,(t-a)/d);return t<a?0:x>1?1:1-Math.exp(-6*x)*Math.cos(9*x);};
const pulse=(t:number,a:number,d=.35)=>Math.sin(clamp((t-a)/d)*Math.PI);
const lerpKeys=(t:number,keys:number[][])=>{let v=keys[0][1];for(let i=1;i<keys.length;i++){if(t<keys[i][0])return mix(v,keys[i][1],prog(t,keys[i-1][0],keys[i][0]));v=keys[i][1];}return v;};
const grade=(t:number)=>lerpKeys(t,[[0,.45],[15.7,.45],[16.6,1],[17.8,1],[18.3,.56]]);
const HIT=[1.25,1.81,2.37,2.93,6,8,10,11,13.35,16.6,18.3,20.5,23.5,25.5];
const FONT='"Noto Sans SC", sans-serif';
const Text=({x,y,children,size=28,color=C.ink,anchor='start',weight=500,rotate=0}:any)=><text x={x} y={y} fontFamily={FONT} fontSize={size} fill={color} textAnchor={anchor} fontWeight={weight} transform={`rotate(${rotate} ${x} ${y})`}>{children}</text>;
const Line=({d,color=C.ink,width=3,...p}:any)=><path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" {...p}/>;
const Panel=({x,y,w,h,fill=C.white,r=18,shadow=true}:any)=><g>{shadow&&<rect x={x+5} y={y+7} width={w} height={h} rx={r} fill="#8f8b7022"/>}<rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={C.ink} strokeWidth={2.8}/><path d={`M${x+20} ${y+5} Q${x+w*.5} ${y+1} ${x+w-22} ${y+4}`} fill="none" stroke={C.ink} strokeOpacity={.12}/></g>;
const Tape=({x,y,w=74,rot=-5}:any)=><g transform={`rotate(${rot} ${x} ${y})`}><path d={`M${x} ${y} l${w} -2 -2 24 -${w} 2 3 -8 -3 -7z`} fill="#d8c8a6" opacity={.7}/><Line d={`M${x+4} ${y+7}h${w-9}`} color="#eee3ca" width={1}/></g>;
const Spark=({x,y,s=1,color=C.yellow}:any)=><path d="M0 -13 Q2 -2 12 0 Q2 2 0 13 Q-2 2 -12 0 Q-2 -2 0 -13Z" transform={`translate(${x} ${y}) scale(${s})`} fill={color}/>;

export function Knot({x=0,y=0,size=25,color=C.green}:any){return <g transform={`translate(${x} ${y}) scale(${size/34})`} fill="none" stroke={color} strokeWidth={3.8} strokeLinejoin="round">{Array.from({length:6},(_,i)=><path key={i} transform={`rotate(${i*60})`} d="M0 -13 C-1 -25 16 -25 21 -16 C25 -9 22 -4 17 0 L5 7 L-6 0 L-6 -10Z"/>)}</g>}

// Local origin is the sole contact plane (feet y=0), with a 190px tall neutral pose.
export function Robot({x,y,s=1,t=0,pose='idle',face='happy',lean=0,handTarget,accent=1}:any){
 const dance=pose==='dance',walk=pose==='walk',point=pose==='point',pull=pose==='pull';
 const beat=Math.sin(t*Math.PI*4),stride=walk?Math.sin(t*15):dance?Math.sin(t*7):0;
 const jumpAge=t-25.5;
 const jump=jumpAge<0||jumpAge>1.35?0:jumpAge<.18?10*pulse(jumpAge,0,.36):jumpAge<.93?10*(1-(jumpAge-.18)/.75)-82*Math.sin((jumpAge-.18)/.75*Math.PI):9*pulse(jumpAge,.93,.42);
 const squash=1+((jumpAge>=0&&jumpAge<.18)?-.10*pulse(jumpAge,0,.36):(jumpAge>=.93&&jumpAge<1.35)?-.13*pulse(jumpAge,.93,.42):0);
 const bob=jump+(walk?-Math.abs(stride)*5:dance?-Math.abs(beat)*9:0);
 const headTilt=lean+(dance?Math.sin(t*4)*9:walk?Math.sin(t*7)*2:0);
 const blink=((t+1.17)%4.3)<.13;
 const left={x:pull?-93:point?-78:-80,y:pull?-99:dance?-145-10*beat:-68};
 const right=handTarget?{x:(handTarget.x-x)/s*squash,y:((handTarget.y-y)/s-bob)/squash}: {x:point?81:dance?83:81,y:point?-70:dance?-155+10*beat:-70};
 return <g transform={`translate(${x} ${y}) scale(${s})`}>
  <ellipse cx={0} cy={3} rx={60} ry={8} fill="#274c3420"/>
  <g transform={`translate(0 ${bob}) scale(${1/squash} ${squash})`}>
   <Line d={`M-28 -44 Q${-32-stride*11} -21 ${-39-stride*21} -9`} color={C.ink} width={24}/>
   <Line d={`M28 -44 Q${33+stride*11} -24 ${40+stride*21} -9`} color={C.ink} width={24}/>
   <Line d={`M-28 -44 Q${-32-stride*11} -21 ${-39-stride*21} -9`} color={C.green} width={15}/>
   <Line d={`M28 -44 Q${33+stride*11} -24 ${40+stride*21} -9`} color={C.green} width={15}/>
   <ellipse cx={-43-stride*21} cy={-6} rx={26} ry={12} fill={C.ink} transform={`rotate(${-stride*12} ${-43-stride*21} -6)`}/>
   <ellipse cx={44+stride*21} cy={-6} rx={26} ry={12} fill={C.ink}/>
   <Line d={`M-42 -86 Q-75 -97 ${left.x} ${left.y}`} color={C.ink} width={22}/>
   <Line d={`M-42 -86 Q-75 -97 ${left.x} ${left.y}`} color={C.green} width={14}/>
   <Line d={`M42 -86 Q${(42+right.x)/2+13} ${right.y-18} ${right.x} ${right.y}`} color={C.ink} width={22}/>
   <Line d={`M42 -86 Q${(42+right.x)/2+13} ${right.y-18} ${right.x} ${right.y}`} color={C.green} width={14}/>
   <path d="M-44 -111 Q0 -127 44 -109 L48 -46 Q3 -27 -49 -46Z" fill={C.white} stroke={C.ink} strokeWidth={4}/>
   <path d="M-42 -54 Q0 -43 44 -53" fill="none" stroke="#cabc9c" strokeWidth={3}/>
   <Knot x={0} y={-74} size={20}/>
   <g transform={`rotate(${headTilt} 0 -133)`}>
    <path d="M-70 -198 Q-78 -191 -78 -176 L-74 -118 Q-72 -104 -57 -102 L58 -104 Q75 -107 76 -123 L76 -181 Q75 -199 57 -203Z" fill="#d2c6ad" stroke={C.ink} strokeWidth={4}/>
    <path d="M-61 -201 Q-71 -197 -71 -183 L-67 -119 Q-63 -110 -52 -110 L57 -112 Q68 -113 69 -126 L69 -183 Q67 -198 53 -200Z" fill={C.white} stroke={C.ink} strokeWidth={3.5}/>
    <path d="M-54 -184 Q-6 -193 51 -184 L54 -131 Q5 -124 -53 -131Z" fill={C.screen} stroke="#647b64" strokeWidth={4}/>
    <path d="M-48 -177 Q-8 -184 45 -178" fill="none" stroke="#81b295" strokeOpacity={.25} strokeWidth={3}/>
    {face==='wink'?<><Line d="M-35 -157q10 -11 21 0M16 -156l17 -5" color={C.mint} width={6}/><path d="M-11 -142Q0 -121 15 -144Z" fill={C.mint}/><ellipse cx={-38} cy={-142} rx={8} ry={4} fill={C.coral}/></>:face==='surprised'?<><ellipse cx={-24} cy={-158} rx={8} ry={13} fill={C.mint}/><ellipse cx={24} cy={-158} rx={8} ry={13} fill={C.mint}/><ellipse cx={0} cy={-138} rx={7} ry={9} fill={C.mint}/></>:<>
     {blink?<><Line d="M-34 -158h17" color={C.mint} width={6}/><Line d="M17 -158h17" color={C.mint} width={6}/></>:face==='think'?<><ellipse cx={-23} cy={-158} rx={6} ry={10} fill={C.mint}/><ellipse cx={23} cy={-158} rx={6} ry={10} fill={C.mint}/><Line d="M-34 -175l16 -4 M17 -179l16 4" color={C.mint} width={4}/></>:<><Line d="M-34 -154v-7q10 -13 19 0v7 M16 -154v-7q10 -13 19 0v7" color={C.mint} width={7}/></>}
     {face==='think'?<Line d="M-8 -139q8 -6 16 0" color={C.mint} width={4}/>:<path d="M-9 -144Q0 -141 10 -145Q9 -127 0 -131Q-9 -132 -9 -144" fill={C.mint}/>}</>}
    <Line d="M-73 -166v30 M-72 -129v5" color="#897d66" width={2}/>
    <circle cx={57} cy={-119} r={2.3} fill={C.green}/>
   </g>
   {[left,right].map((h,i)=><g key={i} transform={`translate(${h.x} ${h.y})`}><path d="M-13 -10Q-14 -22 -5 -22Q1 -25 5 -18Q18 -20 19 -7Q25 5 14 14Q0 22 -13 10Q-21 1 -13 -10Z" fill={C.white} stroke={C.ink} strokeWidth={3.5}/><Line d="M-9 -10q5 2 6 8" color="#b3a98d" width={2}/></g>)}
  </g>
  {accent>1&&<Spark x={85} y={-204} s={accent-1}/>}
 </g>
}

function SceneArt({kind,t=0,w=270,h=475,id='art',saturated=false}:any){
 const sky=kind===0?'#303759':kind===1?'#f2cf84':kind===2?'#b9ddc8':saturated?'#7629c9':'#665385';
 return <svg width={w} height={h} viewBox="0 0 270 475" preserveAspectRatio="xMidYMid slice" overflow="hidden">
  <defs><linearGradient id={id+'sky'} x2="0" y2="1"><stop stopColor={sky}/><stop offset="1" stopColor={kind===3?'#b3a1c6':sky}/></linearGradient></defs>
  <rect width={270} height={475} fill={`url(#${id}sky)`}/>
  {kind===0&&<>
   <path d="M0 365Q110 346 270 370V475H0Z" fill="#293653"/>
   {Array.from({length:16},(_,i)=><path key={'water'+i} d={`M${(i*43)%245+Math.sin(t*2+i)*11} ${385+i*5}h${12+i%4*7}`} stroke={i%2?'#eac685':'#6875a0'} strokeWidth={2} opacity={.35+.2*Math.sin(t*2+i)**2}/>)}
   <path d="M0 314Q135 296 270 314M0 321H270" stroke="#d3b486" strokeWidth={3} fill="none"/>
   {[23,98,173,248].map(x=><g key={x}><path d={`M${x} 315v-66q0 -12 12 -12`} stroke="#b5a889" fill="none" strokeWidth={3}/><circle cx={x+12} cy={237} r={5} fill="#ffe6aa"/><circle cx={x+12} cy={237} r={17} fill="#ffe6aa" opacity={.08}/></g>)}
  
   {Array.from({length:17},(_,i)=><circle key={i} cx={(i*67+17)%265} cy={(i*43+31)%280} r={i%3===0?2.3:1.2} fill="#e5dcbd" opacity={.45+.45*Math.sin(t*1.3+i)**2}/>)}
   <path d="M220 52A34 34 0 1 0 247 107A35 35 0 0 1 220 52" fill={C.yellow}/>
   {Array.from({length:9},(_,i)=>{let hh=100+((i*59)%100);return <g key={i} transform={`translate(${i*35-19} ${365-hh})`}><path d={`M0 ${hh}V0h29v${hh}`} fill={i%2?'#232b47':'#3c4165'} stroke="#191f39" strokeWidth={2}/>{Array.from({length:15},(_,j)=><rect key={j} x={4+j%3*8} y={12+Math.floor(j/3)*19} width={4} height={8} fill={((j+i)%3)?'#d5c176':'#4b5265'} opacity={.8}/>)}</g>})}
   <g transform={`translate(${-76+(t%3.5)/3.5*420} 356)`}><rect width={66} height={19} rx={5} fill="#d9b778" stroke="#222b42" strokeWidth={2}/>{[0,1,2].map(i=><rect key={i} x={7+i*18} y={3} width={12} height={7} rx={1} fill="#ffecc0"/>)}<circle cx={13} cy={19} r={4} fill="#20273f"/><circle cx={53} cy={19} r={4} fill="#20273f"/></g>
   <g opacity={Math.sin(Math.min(1,(t%3.5)/1.2)*Math.PI)*.8}><path d={`M${25+t%3.5*90} ${30+t%3.5*35}l-36 -14`} stroke="#f5e9b7" strokeWidth={2}/></g>
   <Text x={135} y={225} size={20} color="#f5eccb" anchor="middle">晚安，城市</Text>
  </>}
  {kind===1&&<g>
   <path d="M0 345H270V475H0Z" fill="#c39165"/>
   {[0,1,2,3].map(i=><path key={i} d={`M0 ${364+i*28}Q135 ${358+i*28} 270 ${368+i*28}`} stroke="#aa7654" strokeWidth={2} fill="none"/>)}
   <rect x={18} y={64} width={66} height={111} rx={8} fill="#ae5140" stroke="#6f4b35" strokeWidth={2}/><Text x={51} y={104} size={24} color="#fff0cd" anchor="middle">手作</Text><Text x={51} y={145} size={27} color="#fff0cd" anchor="middle">拉面</Text>
   <ellipse cx={237} cy={329} rx={18} ry={9} fill="#f7e6c6"/><path d="M221 330l3 37q13 9 25 -1l3 -37" fill="#e9d5b2" stroke="#886a4a" strokeWidth={2}/>
  
   <circle cx={138} cy={247} r={108} fill="#f9e5b7"/>
   <ellipse cx={136} cy={365} rx={82} ry={12} fill="#a1835540"/>
   <path d="M43 255Q62 357 138 361Q209 355 231 255Z" fill="#f2b6aa" stroke={C.ink} strokeWidth={5}/><ellipse cx={137} cy={255} rx={94} ry={31} fill={C.white} stroke={C.ink} strokeWidth={5}/><ellipse cx={137} cy={255} rx={80} ry={22} fill="#8a7050"/>
   {[0,1,2,3,4].map(i=><Line key={i} d={`M${80+i*22} 253q13 -22 26 0q14 15 26 -4`} color="#f0d177" width={5}/>)}
   {Array.from({length:13},(_,i)=><ellipse key={'scallion'+i} cx={77+(i*31)%111} cy={242+(i*7)%23} rx={4} ry={2} fill="#729459" transform={`rotate(${i*29} ${77+(i*31)%111} ${242+(i*7)%23})`}/>)}<ellipse cx={166} cy={246} rx={26} ry={16} fill={C.white}/><ellipse cx={166} cy={246} rx={12} ry={9} fill="#e5b450"/>
   <path d="M77 224l23 -8 12 28 -23 6z" fill={C.green}/><path d="M107 231l23 -5 2 18 -24 3z" fill="#dd917c"/>
   <g transform={`translate(0 ${-30*(.5-.5*Math.cos(t*Math.PI))}) rotate(${Math.sin(t*Math.PI)*3} 184 160)`}>{[0,1,2].map(i=><Line key={i} d={`M${143+i*5} 232q${-10+i*3} 20 ${Math.sin(t*3+i)*4} ${22+30*(.5-.5*Math.cos(t*Math.PI))}`} color="#f2d58d" width={3}/>)}<Line d="M142 231L225 114M156 235L239 121" color="#564e37" width={6}/></g>
   {[0,1,2].map(i=><Line key={i} d={`M${93+i*40} ${198-((t*.7+i*.33)%1)*45}q-12 -17 0 -34q12 -17 0 -29`} color="#fff4d9" width={6} opacity={Math.sin(((t*.7+i*.33)%1)*Math.PI)*.75}/>)}
   <Text x={135} y={415} size={24} anchor="middle">今天，嗦一口！</Text>
  </g>}
  {kind===2&&<><rect x={20} y={27} width={145} height={153} rx={7} fill="#e9eee0" stroke="#86b29b" strokeWidth={5}/><path d="M92 28v153M20 100h145" stroke="#86b29b" strokeWidth={4}/><path d="M5 26q31 75 0 163M179 26q-31 75 0 163" stroke="#ddd6af" strokeWidth={18} fill="none"/><ellipse cx={139} cy={430} rx={109} ry={22} fill="#a7c4a5"/><path d={`M204 375Q${265+Math.sin(t*3)*10} 349 235 292`} stroke="#b77d4d" strokeWidth={24} strokeLinecap="round" fill="none"/></>}
  {kind===2&&<g transform={`translate(0 ${Math.sin(t*2.5)*3})`}>
   <path d="M62 230L44 109L104 158M165 159L222 109L213 233" fill="#d8985a" stroke={C.ink} strokeWidth={4}/><path d="M56 123L63 181L88 160M180 161L209 126L202 185" fill="#e6a99d"/>
   <ellipse cx={136} cy={331} rx={85} ry={100} fill="#d99d62" stroke={C.ink} strokeWidth={4}/><ellipse cx={136} cy={340} rx={48} ry={60} fill={C.white}/>
   <ellipse cx={135} cy={218} rx={92} ry={81} fill="#d99d62" stroke={C.ink} strokeWidth={4}/><path d="M46 219Q69 257 107 217Q138 265 163 219Q203 257 225 219Q227 290 138 299Q49 289 46 219" fill={C.white}/>
   {Math.sin(t*2.4)>.9?<Line d="M80 214q13 -14 26 0M164 214q13 -14 26 0" width={4}/>:<><ellipse cx={93} cy={211} rx={5} ry={8} fill={C.ink}/><ellipse cx={177} cy={211} rx={5} ry={8} fill={C.ink}/></>}<path d="M126 237q10 -9 20 0l-10 10Z" fill={C.ink}/><Line d="M136 246v8q-11 10 -18 0M136 254q11 10 18 0" width={3}/>
   <Line d="M73 238l-31 -8M73 246l-33 2M193 238l31 -8M193 246l33 2M119 157l8 22M138 151v25M157 157l-8 22" color="#a26b40" width={3}/><ellipse cx={81} cy={242} rx={14} ry={7} fill="#e7a69a"/><ellipse cx={192} cy={242} rx={14} ry={7} fill="#e7a69a"/>
   <g transform={`rotate(${-20-24*Math.sin(t*Math.PI)} 200 340)`}><path d="M195 353Q212 316 203 287" stroke={C.ink} strokeWidth={29} fill="none" strokeLinecap="round"/><path d="M195 353Q212 316 203 287" stroke="#d99d62" strokeWidth={22} fill="none" strokeLinecap="round"/><ellipse cx={203} cy={286} rx={13} ry={16} fill={C.white}/></g>
   {[0,1,2].map(i=><g key={i} transform={`translate(${45+i*87} ${65+Math.sin(t*3+i)*9}) scale(.7)`}><path d="M0 0C-20 -22 -28 8 0 23C28 8 20 -22 0 0" fill={i%2?C.coral:C.white} stroke={C.ink} strokeWidth={2}/></g>)}
  </g>}
  {kind===3&&<>
   <path d="M0 0H37Q15 160 45 302H0ZM270 0H233Q255 160 225 302H270Z" fill="#49395f"/>
   {[20,250].map((x,i)=><g key={x}><rect x={x-14} y={270} width={29} height={68} rx={4} fill="#302d44" stroke="#b49cb9" strokeWidth={2}/><circle cx={x} cy={315} r={9} fill="#514361" stroke="#cfbad8" strokeWidth={2}/><circle cx={x} cy={285} r={5} fill="#b9a7cf"/></g>)}
   <g transform={`rotate(${Math.sin(t*Math.PI)*13} 135 65)`}><path d="M128 65L0 355H92Z" fill="#efd6ad" opacity={.13}/><path d="M142 65L270 355H178Z" fill="#a4ead5" opacity={.13}/></g>
   <ellipse cx={135} cy={399} rx={73+Math.sin(t*4*Math.PI)*4} ry={13} fill="#dcc8e4" opacity={.15}/>
  
   <path d="M135 65L0 315H270Z" fill="#e6cef1" opacity={.16}/><path d="M135 65L60 315H185Z" fill="#f7e5d4" opacity={.16}/>
   <rect x={0} y={315} width={270} height={160} fill="#48436b"/>
   {[0,1,2,3].map(r=>Array.from({length:8},(_,i)=>{let y0=315+160*(r/4)**1.8,y1=315+160*((r+1)/4)**1.8;const span0=70+(y0-315)*1.4,span1=70+(y1-315)*1.4;return <path key={r+'-'+i} d={`M${135+(i-4)*span0/4} ${y0}L${135+(i-3)*span0/4} ${y0}L${135+(i-3)*span1/4} ${y1}L${135+(i-4)*span1/4} ${y1}Z`} fill={(i+r)%2?(saturated?'#87d6fa':'#afa1cd'):'#5c5785'}/>}))}
   <Line d="M135 0V47" color="#34354a" width={3}/><circle cx={135} cy={68} r={24} fill="#cabbdc" stroke="#4c4466" strokeWidth={3}/><ellipse cx={135} cy={68} rx={10} ry={23} fill="none" stroke="#887fa5" strokeWidth={2}/><path d="M114 59h43M112 74h46" stroke="#f2eaf4" strokeWidth={4}/>
   <Robot x={135+Math.sin(t*4)*9} y={390} s={.77} t={t} pose="dance"/>
   {Array.from({length:6},(_,i)=><Spark key={i} x={24+(i*57)%240} y={112+(i*31)%160} s={.3+.15*Math.sin(t*3+i)} color={i%2?C.yellow:'#e2cde3'}/>)}
  </>}
 </svg>
}

function Phone({t,kind,mediaTime,ready,large=1}:any){
 const swing=between(t,8,8.7)?Math.sin((t-8)/.7*Math.PI*2)*8:0;
 const glitch=between(t,10,10.4),over=between(t,16.5,17.8);
 return <g transform={`translate(945 440) rotate(${swing}) scale(${large}) translate(-150 -264)`}>
  <rect x={3} y={10} width={300} height={537} rx={39} fill="#56514633"/>
  <rect width={300} height={537} rx={37} fill="#2e3236" stroke="#1f2e28" strokeWidth={5}/>
  <rect x={7} y={8} width={286} height={520} rx={31} fill="#5f6260"/>
  <clipPath id="phoneClip"><rect x={15} y={17} width={270} height={501} rx={25}/></clipPath>
  <g clipPath="url(#phoneClip)"><g transform={`translate(${15+(glitch?Math.sin(t*150)*8:0)} 17)`}>
    <rect width={270} height={501} fill="#202b27"/>
    {ready&&<g style={{filter:`saturate(${grade(t)*2}) contrast(${1+Math.max(0,grade(t)-.45)*.42}) brightness(${1+Math.max(0,grade(t)-.45)*.12})`}}><SceneArt kind={kind} t={mediaTime} h={501} id="phone"/><rect width={270} height={501} fill="#ff994e" opacity={Math.max(0,grade(t)-.45)*.17}/></g>}
    {between(t,5.4,6.1)&&<g opacity={.75}><rect width={270} height={501} fill="#aaa69b"/><Text x={135} y={240} size={32} anchor="middle">多余片段…</Text></g>}
    {glitch&&[0,1,2,3,4].map(i=><rect key={i} x={0} y={i*83+(Math.floor(t*40)%3)*9} width={270} height={9} fill={i%2?'#a4f3ab':'#c291d9'} opacity={.6}/>)}
    {between(t,11.0,13.35)&&<g transform={`translate(135 ${mix(130,288,prog(t,11.0,11.55))}) scale(${pop(t,11.0,.38)})`}><rect x={-109} y={-33} width={218} height={59} rx={8} fill={C.yellow} stroke={C.ink} strokeWidth={3}/><Text x={0} y={7} size={25} anchor="middle" weight={800}>前方高能预警</Text></g>}
    {t>28&&<g transform={`translate(135 124) scale(${pop(t,28)})`}><Text x={0} y={0} size={35} color={C.yellow} anchor="middle" weight={900}>搞定了！</Text></g>}
  </g></g>
  <rect x={114} y={18} width={73} height={15} rx={9} fill="#262a29"/>
  <Line d="M-3 92v30M-3 138v36M303 124v43" color="#292d2b" width={4}/>
  <Line d="M121 503h58" color="#eee9df" width={4}/>
  <g transform="translate(150 568)"><circle r={17} fill={C.white} stroke={C.ink} strokeWidth={2}/><path d="M-4 -7L8 0 -4 7Z" fill={C.ink}/><path d="M-47 -7v14m-4 -14l-12 7 12 7 M47 -7v14m4 -14l12 7 -12 7" stroke={C.ink} strokeWidth={2} fill={C.ink}/></g>
 </g>
}

function Timeline({t}:any){
 const cut=prog(t,6.0,6.65),loaded=prog(t,.65,3.6),beats=prog(t,20.5,21.5);
 const play=playbackAt(t).x;
 return <g>
  <Panel x={67} y={785} w={1787} h={245}/>
  <Line d="M139 800v215M72 845h1776" width={2} color="#9e9d85"/>
  <Text x={98} y={826} size={22} anchor="middle">✂</Text>
  {Array.from({length:33},(_,i)=><g key={i}><Line d={`M${156+i*50} 834v${i%4===0?-14:-7}`} color="#9c9b86" width={1.5}/>{i%4===0&&<Text x={156+i*50} y={813} size={16} color={C.muted} anchor="middle">0:{String(i/2).padStart(2,'0')}</Text>}</g>)}
  {['T','▶','♪'].map((a,i)=><g key={a}><rect x={86} y={858+i*53} width={31} height={31} rx={7} fill={[C.yellow,C.mint,C.violet][i]} stroke={C.ink} strokeWidth={2}/><Text x={101} y={881+i*53} size={22} anchor="middle">{a}</Text></g>)}
  {t>10.8&&<g opacity={t<13.35?1:1-prog(t,13.35,13.65)}><rect x={clipsAt(t)[2].x} y={857} width={clipsAt(t)[2].width} height={31} rx={7} fill={C.yellow} stroke={C.ink} strokeWidth={2}/><Text x={clipsAt(t)[2].x+12} y={879} size={18}>T 前方高能预警</Text></g>}
  {[0,1,2,3].map((k)=>{const clip=clipsAt(t)[k],{x,width}=clip;const enter=pop(t,clip.drop,.24);return <g key={k} transform={`translate(${x} ${899+(1-enter)*9})`} opacity={clamp(enter)}>
   <rect width={width} height={58} rx={1} fill={['#444a69','#dfc48c','#b4d9c4','#aaa0c7'][k]} stroke={C.ink} strokeWidth={2}/>
   {Array.from({length:Math.floor(width/66)},(_,i)=><g key={i} transform={`translate(${i*66+3} 3)`}><SceneArt kind={k} t={0} w={61} h={51} id={`tl${k}${i}`}/></g>)}
   <rect x={6} y={4} width={70} height={17} rx={4} fill={C.white}/><Text x={12} y={17} size={13}>{['夜景.mp4','拉面.mp4','小猫.mp4','GPT.mp4'][k]}</Text>
  </g>})}
  {clipsAt(t).slice(1).map(c=>{const hit=pulse(t,c.drop,.28)+pulse(t,6.65,.32);return <g key={'join'+c.kind} opacity={hit}><Line d={`M${c.x} 893v69`} width={4} color={C.mint}/><Spark x={c.x} y={891} s={hit*.55}/></g>})}
  {between(t,4.8,6.9)&&<g transform={`translate(${mix(780,1340,prog(t,6.0,6.7))} ${mix(899,742,prog(t,6,6.55))+90*prog(t,6.55,6.85)}) rotate(${prog(t,6,6.8)*60})`} opacity={1-prog(t,6.6,6.85)}><rect width={100} height={58} rx={7} fill="#b5b1a4" stroke={C.ink} strokeWidth={2}/><path d="M5 5l90 48M95 5L5 53" stroke="#727b71" strokeWidth={2}/></g>}
  {t>2.7&&<g opacity={prog(t,2.7,3.1)}><rect x={156} y={969} width={1570*loaded} height={39} rx={6} fill="#c9c1df" stroke="#8a81a3" strokeWidth={1.5}/>{Array.from({length:250},(_,i)=>{const h=3+Math.abs(Math.sin(i*.71)*Math.cos(i*.31))*22;return <path key={i} d={`M${164+i*6.2} ${989-h/2}v${h}`} stroke="#8b82a8" strokeWidth={1.7}/>})}</g>}
  {Array.from({length:29},(_,i)=><g key={i} opacity={clamp(beats*31-i)}><path d={`M${184+i*52} 1016l5 8 5 -8Z`} fill={C.yellow} stroke={C.ink} strokeWidth={1}/></g>)}
  <g transform={`translate(${play} 0)`}><Line d="M0 842V1018" color={C.coral} width={3}/><path d="M-7 832h14v10l-7 7 -7 -7Z" fill={C.coral} stroke={C.ink} strokeWidth={2}/></g>
 </g>
}

const tagText=(t:number)=>t<4?'把灵感拖进来':t<7?'多余的，剪掉':t<10.5?'转场，试一下':t<14.5?'错了？撤销就好':t<20?'调出一点气氛':t<23?'让画面踩上节拍':t<26.5?'最后，导出成片':'用 Codex，把想法动起来';

export const GptWorkbenchV4:React.FC=()=>{
 const t=useCurrentFrame()/30;
 const playback=playbackAt(t),kind=playback.kind;
 const zoom=lerpKeys(t,[[0,1],[14.5,1],[15.3,1.09],[18.9,1.09],[20,1],[26,1],[27,1]]);
 const camx=lerpKeys(t,[[0,0],[14.5,0],[15.3,-96],[18.9,-96],[20,0]]);
 const botX=lerpKeys(t,[[0,425],[.7,430],[2.7,680],[3.6,860],[4.8,925],[5.5,1060],[6.8,1260],[7.4,450],[9.8,470],[10.7,665],[12.8,665],[14.4,1100],[15.2,1310],[19.5,1335],[20.5,1030],[22.5,1625],[24,1730],[26,1730],[27.5,1630]]);
 const botY= t>26.5?mix(778,805,prog(t,26.5,27.5)):778;
 const running=between(t,.7,3.5)||between(t,6.8,7.4)||between(t,13.5,15.2)||between(t,20.5,22.5);
 const pointerCues=[{a:4.95,b:6.1,x:830,y:925},{a:7.65,b:8.65,x:355,y:340},{a:9.7,b:10.45,x:355,y:466},{a:10.7,b:11.55,x:270,y:335},{a:20.2,b:21.4,x:1610,y:694},{a:23.2,b:23.85,x:1725,y:138}];
 const cue=pointerCues.find(c=>between(t,c.a,c.b));
 let target=between(t,15.2,19.6)?{x:1410+392*lerpKeys(t,[[0,.45],[15.7,.45],[16.6,1],[17.8,1],[18.3,.56]]),y:423,strength:Math.min(prog(t,15.2,15.45),1-prog(t,19.35,19.6))}:cue?{...cue,strength:Math.min(prog(t,cue.a,cue.a+.18),1-prog(t,cue.b-.16,cue.b))}:undefined;
 const flying=[0,1,2,3].find(k=>between(t,.6+k*.56,.6+k*.56+.67));
 if(flying!==undefined){const a=.6+flying*.56,p=prog(t,a,a+.65);target={x:mix(170+(flying%2)*180,clipsAt(0)[flying].x+clipsAt(0)[flying].width/2,p)+55,y:mix(390+Math.floor(flying/2)*160,923,p)-100*Math.sin(p*Math.PI),strength:Math.min(prog(t,a,a+.12),1-prog(t,a+.55,a+.67))};}
 if(between(t,6,6.95)){const contact={x:clipsAt(t)[2].x+24,y:925};const strength=Math.min(prog(t,6,6.12),1-prog(t,6.72,6.95));target={...contact,strength};}
 if(between(t,13.05,13.75))target={x:650,y:665,strength:Math.min(prog(t,13.05,13.3),1-prog(t,13.5,13.75))};
 const loading=prog(t,23.5,25.5),finish=prog(t,26,27);
 return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1920 1080" style={{background:C.paper}}>
  <defs><pattern id="fibers" width={160} height={110} patternUnits="userSpaceOnUse">{Array.from({length:26},(_,i)=><path key={i} d={`M${(i*47)%160} ${(i*29)%110}l${2+i%3} 1`} stroke="#776d4d" strokeOpacity={.09} strokeWidth={.6}/>)}</pattern></defs>
  <image href={staticFile('textures/codex-paper.png')} width={1920} height={1080} opacity={.23} preserveAspectRatio="xMidYMid slice"/>
  <g transform={`translate(${camx} ${-(zoom-1)*300}) scale(${zoom})`}>
   <g opacity={1-finish*.65}>
    <Panel x={48} y={108} w={1824} h={662}/>
    <Line d="M48 171H1872" color="#a6a48c" width={2}/>
    {[C.coral,C.yellow,C.mint].map((fill,i)=><circle key={i} cx={79+i*25} cy={139} r={7} fill={fill} stroke={C.ink} strokeWidth={1.5}/>)}
    <Text x={180} y={149} size={29}>我的第一支动画 / GPT studio</Text>
    <rect x={894} y={123} width={181} height={33} rx={8} fill={C.ink}/><Text x={984} y={147} size={22} color={C.white} anchor="middle">00:{Math.floor(playback.position).toString().padStart(2,'0')}:{Math.floor((playback.position%1)*30).toString().padStart(2,'0')}</Text>
    <Text x={1565} y={148} size={24} anchor="end">1080p</Text>
    <g transform={`translate(1607 120) scale(${1-.035*pulse(t,23.5)})`}><rect width={235} height={38} rx={11} fill={loading>0?C.yellow:C.mint} stroke={C.ink} strokeWidth={2}/><Text x={117} y={27} size={23} anchor="middle">{t<23.5?'↑ 导出':t<25.6?`渲染中 ${Math.min(99,Math.round(loading*100))}%`:'✓ 已完成'}</Text></g>
    <Panel x={76} y={205} w={395} h={544} fill="#f6f0e1"/>
    {['素材','特效','文字'].map((s,i)=><g key={s}><rect x={91+i*123} y={220} width={111} height={43} rx={8} fill={((t<7&&i===0)||(t>=7&&t<10.5&&i===1)||(t>=10.5&&i===2))?C.yellow:C.white} stroke={C.ink} strokeWidth={1.8}/><Text x={146+i*123} y={249} size={24} anchor="middle">{s}</Text></g>)}
    {t<7?<g>{[0,1,2,3].map((k)=><g key={k} transform={`translate(${93+(k%2)*182} ${289+Math.floor(k/2)*161})`}><rect x={-3} y={-3} width={165} height={131} rx={10} fill={C.white} stroke={C.ink} strokeWidth={2}/><SceneArt kind={k} w={159} h={111} t={0} id={'asset'+k}/><Text x={80} y={148} size={18} anchor="middle">{['城市夜色','热气拉面','猫猫治愈','GPT舞台'][k]}</Text><Tape x={54} y={-9} w={57}/></g>)}</g>:t<10.5?<g>{['淡入','翻转','推近','故障','纸片','弹跳'].map((a,i)=><g key={a} transform={`translate(${94+i%2*181} ${291+Math.floor(i/2)*126})`}><Panel x={0} y={0} w={162} h={101} fill={[C.mint,'#eac4b3','#d5cce3'][Math.floor(i/2)]}/><Text x={81} y={48} size={31} anchor="middle">{['◉','↔','⌕','≋','▱','↟'][i]}</Text><Text x={81} y={83} size={21} anchor="middle">{a}</Text></g>)}</g>:<g>{['前方高能','好耶～','复古 NEON'].map((a,i)=><g key={a} transform={`translate(97 ${295+i*110})`}><Panel x={0} y={0} w={350} h={81} fill={[C.yellow,'#efd4d0','#574665'][i]}/><Text x={175} y={53} size={i===2?30:32} color={i===2?'#e8d8fa':C.ink} anchor="middle" weight={800}>{a}</Text></g>)}<Text x={272} y={683} size={21} color={C.muted} anchor="middle">拖到画面，马上开演</Text></g>}
    <Panel x={1380} y={205} w={462} h={544} fill="#f6f0e1"/>
    <Text x={1408} y={251} size={29}>调整 ✧</Text>
    {['亮度','饱和度','颗粒感','速度'].map((name,i)=>{let val=i===1?grade(t):i===0?.65:i===2?.28:.47;return <g key={name}>
     <Text x={1410} y={300+i*98} size={24}>{name}</Text><Text x={1803} y={300+i*98} size={21} color={C.muted} anchor="end">{i===3?'1.0×':`${Math.round(val*(i===1?200:100))}%`}</Text>
     <Line d={`M1410 ${325+i*98}H1802`} color="#c4c3aa" width={6}/><Line d={`M1410 ${325+i*98}H${1410+392*val}`} color={C.green} width={6}/><circle cx={1410+392*val} cy={325+i*98} r={10} fill={C.white} stroke={C.ink} strokeWidth={2}/>
    </g>})}
    <g opacity={t>20?pop(t,20.1):.55}><Panel x={1408} y={667} w={404} h={57} fill={C.mint}/><Text x={1610} y={705} size={25} anchor="middle">♪ {t>21?'节拍已对齐 ✓':'自动卡点'}</Text></g>
    <Timeline t={t}/>
   </g>
   <Phone t={t} kind={kind} mediaTime={playback.localTime} ready={playback.ready} large={1+finish*.11}/>
   {/* Cards actually travel from the asset drawer to the timeline. */}
   {[0,1,2,3].map(k=>{const a=.6+k*.56,p=prog(t,a,a+.65);return between(t,a,a+.67)?<g key={k} transform={`translate(${mix(170+(k%2)*180,clipsAt(0)[k].x+clipsAt(0)[k].width/2,p)} ${mix(390+Math.floor(k/2)*160,923,p)-100*Math.sin(p*Math.PI)}) rotate(${Math.sin(p*Math.PI)*(-12+k*7)}) scale(${mix(1,.68,p)})`}><rect x={-70} y={-50} width={140} height={100} rx={8} fill={C.white} stroke={C.ink} strokeWidth={3}/><g transform="translate(-65 -45)"><SceneArt kind={k} w={130} h={90} id={'fly'+k}/></g></g>:null})}
   {between(t,5.7,7.2)&&<g transform={`translate(1355 ${756+(1-pop(t,5.7))*80})`}><path d="M-34 -65h68l-9 62h-47Z" fill="#c0c8b5" stroke={C.ink} strokeWidth={3}/><Line d="M-20 -55l4 41M0 -55v43M20 -55l-4 41" color="#879a83" width={3}/><path d={`M-40 -69h80`} stroke={C.ink} strokeWidth={6} transform={`rotate(${-25*pulse(t,6.4,.5)} -40 -69)`}/></g>}
   {between(t,12.8,14.5)&&<g transform={`translate(650 ${682+(1-pop(t,12.8))*70}) rotate(-5)`}><Panel x={-130} y={-53} w={260} h={87}/><Text x={0} y={4} size={42} anchor="middle" weight={800}>Ctrl + Z</Text></g>}
   {between(t,13.65,15.05)&&<g transform={`translate(1190 485) rotate(-12) scale(${pop(t,13.65)})`}><rect x={-100} y={-40} width={200} height={68} rx={7} fill="none" stroke={C.green} strokeWidth={4}/><Text x={0} y={7} size={33} color={C.green} anchor="middle">已修正 ✓</Text></g>}
   {between(t,16.4,18)&&<g transform={`translate(1236 287) rotate(-7) scale(${pop(t,16.4,.4)})`}><Text x={0} y={0} size={25} color="#955575" anchor="middle" weight={900}>有点……太满了！</Text></g>}
   {target&&HIT.map((hit,i)=>{const age=t-hit,q=clamp(age/.42);return age>=0&&age<.42?<g key={i} opacity={1-q}><circle cx={target.x} cy={target.y} r={12+q*29} fill="none" stroke={C.green} strokeWidth={2}/>{[0,1,2,3].map(j=><Spark key={j} x={target.x+Math.cos(j*Math.PI/2)*(20+q*24)} y={target.y+Math.sin(j*Math.PI/2)*(20+q*24)} s={.45*(1-q)} color={C.yellow}/>)}</g>:null})}
   <Robot x={botX} y={botY} s={t>26?mix(.71,.95,finish):.71} t={t} handTarget={target?{x:mix(botX+57.5,target.x,target.strength),y:mix(botY-49.7,target.y,target.strength)}:undefined} pose={target?'point':running?'walk':t>25.5?'dance':t<4?'pull':'idle'} face={between(t,5.3,6)||between(t,16.5,17.8)?'surprised':between(t,24,25.5)?'think':between(t,18.3,19.6)||t>28?'wink':'happy'} lean={between(t,6,6.65)?-9:target?Math.sin(t*2)*3:0}/>

   {t>26.5&&<g transform={`translate(${mix(60,282,finish)} ${mix(430,406,finish)}) rotate(-4)`} opacity={finish}><Panel x={0} y={0} w={381} h={254}/><Tape x={119} y={-12} w={115}/><Text x={39} y={64} size={29}>想法，变成动画。</Text><Text x={39} y={135} size={61} weight={800}>Made with</Text><Text x={39} y={205} size={67} color={C.green} weight={800}>Codex</Text><Line d="M35 221Q170 227 294 216" color={C.coral} width={5}/></g>}
   {t>25.5&&Array.from({length:24},(_,i)=>{const age=t-25.5-i*.025;let q=clamp(age/3.8);return age>0?<g key={i} transform={`translate(${960+(i%2?1:-1)*(100+(i*71)%700)*q} ${360-190*Math.sin(q*Math.PI)+350*q*q}) rotate(${i*30+q*200})`} opacity={1-q}><rect width={7+i%4*2} height={14} rx={2} fill={[C.green,C.yellow,C.coral,C.violet][i%4]}/></g>:null})}
  </g>
  <rect width={1920} height={1080} fill="url(#fibers)" pointerEvents="none"/>
  {/* Fixed storytelling strip leaves the top chapter band free. */}
  <g><Text x={63} y={84} size={39} weight={800}>{tagText(t)}</Text><Text x={1845} y={82} size={24} color={C.muted} anchor="end">手绘工作台 · GPT 小导演</Text></g>
 </svg>;
};
