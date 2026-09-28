// 手机内部的四个素材。素材架缩略图、时间轴片段缩略图、手机预览共用这里的同一套图形
// （通过 <use href="#ds..."/> 引用），保证三处不会长得不一样。
import React from 'react';
import { C } from '../theme';

export const SW = 300; // 素材内部坐标系宽
export const SH = 564; // 高
const INK = C.outline;

// ------------------------------------------------------------------ 夜景
const STARS: Array<[number, number, number]> = [
  [30, 52, 1.6], [58, 28, 1.2], [92, 66, 1.8], [126, 34, 1.3], [152, 88, 1.1],
  [178, 46, 1.6], [206, 22, 1.2], [246, 96, 1.4], [268, 54, 1.2], [40, 118, 1.3],
  [110, 126, 1.1], [196, 132, 1.5], [24, 190, 1.2], [272, 168, 1.3], [86, 168, 1.1],
  [230, 178, 1.2], [62, 226, 1.1], [258, 240, 1.3], [136, 196, 1.1], [16, 296, 1.2],
];
const BUILDINGS: Array<[number, number, number, number]> = [
  // x, w, top, 色阶
  [18, 44, 300, 0], [58, 52, 262, 1], [106, 40, 322, 0], [142, 56, 244, 1],
  [194, 42, 306, 0], [232, 50, 276, 1],
];
const WIN_ROWS = 5;

function winSeed(i: number, r: number, c: number) {
  const v = Math.sin(i * 12.9898 + r * 78.233 + c * 37.719) * 43758.5453;
  return v - Math.floor(v);
}

const Night = ({t=0}:{t?:number}) => (
  <g>
    <rect x={0} y={0} width={SW} height={SH} fill={C.night} />
    <rect x={0} y={0} width={SW} height={230} fill="#233159" />
    {/* 月牙：底色圆 + 偏移的夜空圆 */}
    <circle cx={238} cy={78} r={32} fill={C.moon} />
    <circle cx={222} cy={64} r={30} fill="#233159" />
    {STARS.map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={.4+.6*Math.sin(t*2+i)**2} />
    ))}
    {BUILDINGS.map(([x, w, top, tone], i) => {
      const fill = tone === 0 ? C.night2 : C.night3;
      return (
        <g key={i}>
          <rect x={x} y={top} width={w} height={470 - top} rx={4} fill={fill} />
          {Array.from({ length: WIN_ROWS }).map((_, r) =>
            Array.from({ length: Math.max(1, Math.floor(w / 13)) }).map((_, c) => {
              const on = winSeed(i, r, c) > 0.42;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={x + 7 + c * 13}
                  y={top + 12 + r * 22}
                  width={6}
                  height={9}
                  rx={1.4}
                  fill={C.nightWin}
                  opacity={on ? 0.92 : 0.12}
                />
              );
            })
          )}
        </g>
      );
    })}
    <g transform={`translate(${-80+(t%3.2)/3.2*470},454)`}><rect width={72} height={19} rx={5} fill="#E4C383" stroke={INK} strokeWidth={2}/>{[0,1,2,3].map(i=><rect key={i} x={6+i*16} y={3} width={11} height={7} fill="#FFF1BB"/>)}<circle cx={14} cy={20} r={4} fill={INK}/><circle cx={58} cy={20} r={4} fill={INK}/></g>
    {/* 水面倒影 */}
    <rect x={0} y={470} width={SW} height={94} fill="#182240" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <rect
        key={i}
        x={16 + ((i * 41) % 210)+Math.sin(t*2+i)*13}
        y={486 + i * 11}
        width={38 + (i % 3) * 22}
        height={2.6}
        rx={1.3}
        fill="#8FA6D8"
        opacity={0.5}
      />
    ))}
    <text
      x={150} y={228} textAnchor="middle" fill="#FFFFFF" fontSize={27}
      fontWeight={700} letterSpacing={5} fontFamily="inherit"
    >
      晚安，城市
    </text>
  </g>
);

// ------------------------------------------------------------------ 拉面
const Ramen = ({t=0}:{t?:number}) => (
  <g>
    <defs>
      <linearGradient id="dsRamenBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.ramenBg} />
        <stop offset="100%" stopColor={C.ramenBg2} />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={SW} height={SH} fill="url(#dsRamenBg)" />
    <rect x={0} y={0} width={SW} height={SH} fill="#D8A96F" opacity={0.18} />
    {/* 红标签 */}
    <g transform="translate(22,30)">
      <rect width={116} height={40} rx={8} fill="#BE4F3E" />
      <text x={58} y={28} textAnchor="middle" fill="#FFF6E8" fontSize={21} fontWeight={700} fontFamily="inherit">
        手作拉面
      </text>
    </g>
    {/* 蒸汽 */}
    {[70, 132, 196].map((x, i) => (
      <path
        key={i}
        transform={`translate(${Math.sin(t*2+i)*7},${-((t*.65+i*.33)%1)*40})`} d={`M ${x} 150 q 14 -22 0 -44 q -14 -22 0 -44`}
        fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={Math.sin(((t*.65+i*.33)%1)*Math.PI)*.6}
      />
    ))}
    {/* 筷子 */}
    <g transform={`translate(0,${-30*(.5-.5*Math.cos(t*Math.PI))})`} stroke="#C89A5E" strokeWidth={7} strokeLinecap="round">
      <path d="M 236 118 L 168 296" />
      <path d="M 252 126 L 186 302" />
    </g>
    {/* 碗：外壁向外鼓，口沿是一个椭圆 */}
    <path
      d="M 38 294 C 32 368, 78 450, 150 450 C 222 450, 268 368, 262 294 C 236 330, 64 330, 38 294 Z"
      fill={C.bowl} stroke={INK} strokeWidth={4}
    />
    <ellipse cx={150} cy={296} rx={112} ry={26} fill="#F7EFE2" stroke={INK} strokeWidth={3.4} />
    <ellipse cx={150} cy={298} rx={100} ry={21} fill={C.soup} />
    <ellipse cx={150} cy={294} rx={88} ry={16} fill="#8C5946" opacity={0.7} />
    <path d="M 74 348 C 92 400, 120 424, 150 424" fill="none" stroke="#D9C6A8" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
    {/* 面条 */}
    <g fill="none" stroke={C.noodle} strokeWidth={7} strokeLinecap="round">
      <path d="M 78 296 q 22 -14 44 2 q 22 16 44 -2 q 22 -18 44 2" />
      <path d="M 92 310 q 24 -12 46 2 q 22 14 44 -2" />
      <path d="M 108 322 q 20 -10 40 2" />
    </g>
    <g transform={`translate(0,${-30*(.5-.5*Math.cos(t*Math.PI))})`} stroke={C.noodle} strokeWidth={4} fill="none">{[0,1,2].map(i=><path key={i} d={`M ${171+i*6} 283 q -8 12 0 ${20+30*(.5-.5*Math.cos(t*Math.PI))}`} />)}</g>
    {/* 蛋 */}
    {[104, 200].map((x, i) => (
      <g key={i}>
        <ellipse cx={x} cy={302 + i * 4} rx={24} ry={17} fill="#FBEBD6" stroke={INK} strokeWidth={2.6} />
        <ellipse cx={x} cy={302 + i * 4} rx={11} ry={9} fill="#E8A33D" />
      </g>
    ))}
    {/* 葱花 */}
    {[132, 158, 176, 118].map((x, i) => (
      <circle key={i} cx={x} cy={286 - (i % 2) * 8} r={4.6} fill="#7FA85F" />
    ))}
    <rect x={96} y={452} width={108} height={16} rx={6} fill="#E2CBA8" />
  </g>
);

// ------------------------------------------------------------------ 小猫
const Cat = ({t=0}:{t?:number}) => (
  <g>
    <defs>
      <linearGradient id="dsCatBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.catBg} />
        <stop offset="100%" stopColor={C.catBg2} />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={SW} height={SH} fill="url(#dsCatBg)" />
    {/* 爱心 */}
    {[
      [96, 108, 15, '#FFFFFF', 0.9],
      [150, 86, 20, '#E9728C', 1],
      [204, 108, 15, '#FFFFFF', 0.9],
    ].map(([x, y, s, f, o], i) => (
      <path
        key={i}
        transform={`translate(${x},${Number(y)+Math.sin(t*3+i)*15}) scale(${(s as number) / 16})`}
        d="M 0 10 C -14 -2 -12 -14 -4 -14 C 0 -14 0 -10 0 -8 C 0 -10 0 -14 4 -14 C 12 -14 14 -2 0 10 Z"
        fill={f as string}
        opacity={o as number}
      />
    ))}
    {/* 耳朵 */}
    <path d="M 76 214 L 70 138 L 132 182 Z" fill={C.catFur2} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M 224 214 L 230 138 L 168 182 Z" fill={C.catFur2} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M 88 206 L 84 160 L 122 186 Z" fill="#F6C6A0" />
    <path d="M 212 206 L 216 160 L 178 186 Z" fill="#F6C6A0" />
    {/* 头 */}
    <ellipse cx={150} cy={288} rx={104} ry={92} fill={C.catFur} stroke={INK} strokeWidth={4.4} />
    {/* 额头条纹 */}
    <g stroke={C.catFur2} strokeWidth={7} strokeLinecap="round" fill="none">
      <path d="M 150 208 L 150 236" />
      <path d="M 128 212 L 122 236" />
      <path d="M 172 212 L 178 236" />
    </g>
    {/* 脸颊奶白 */}
    <ellipse cx={150} cy={318} rx={62} ry={46} fill={C.catCream} opacity={0.85} />
    {/* 闭眼笑 */}
    <g transform={`translate(0,${284*(1-(Math.sin(t*3)>.92?.15:1))}) scale(1,${Math.sin(t*3)>.92?.15:1})`} fill="none" stroke={INK} strokeWidth={5.2} strokeLinecap="round">
      <path d="M 96 284 Q 112 266 128 284" />
      <path d="M 172 284 Q 188 266 204 284" />
    </g>
    {/* 鼻子与嘴 */}
    <path d="M 142 308 L 158 308 L 150 318 Z" fill="#D97A86" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
    <path d="M 150 318 q -12 14 -22 2 M 150 318 q 12 14 22 2" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
    {/* 胡须 */}
    <g stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.75}>
      <path d="M 74 296 L 26 284" /><path d="M 74 310 L 24 310" /><path d="M 76 324 L 30 338" />
      <path d="M 226 296 L 274 284" /><path d="M 226 310 L 276 310" /><path d="M 224 324 L 270 338" />
    </g>
    {/* 胸前 */}
    <ellipse cx={150} cy={470} rx={78} ry={80} fill={C.catFur} stroke={INK} strokeWidth={4.4} />
    <ellipse cx={150} cy={484} rx={48} ry={58} fill={C.catCream} opacity={0.9} />
    {/* 爪 */}
    <ellipse cx={92} cy={470} rx={24} ry={19} fill={C.catCream} stroke={INK} strokeWidth={3.4} />
    <g transform={`rotate(${-20-25*Math.sin(t*Math.PI)},218,446)`}><path d="M208 470Q235 420 222 391" stroke={INK} strokeWidth={32} fill="none" strokeLinecap="round"/><path d="M208 470Q235 420 222 391" stroke={C.catFur} strokeWidth={25} fill="none" strokeLinecap="round"/><ellipse cx={222} cy={391} rx={21} ry={25} fill={C.catCream} stroke={INK} strokeWidth={3}/></g>
  </g>
);

// ------------------------------------------------------------------ 舞台（静态背景）
function tileRows() {
  const rows: Array<{ y: number; h: number; inset: number }> = [];
  const top = 402;
  const bottom = SH;
  const n = 7;
  for (let i = 0; i < n; i++) {
    const u0 = i / n;
    const u1 = (i + 1) / n;
    const y0 = top + (bottom - top) * u0 * u0 * 0.4 + (bottom - top) * u0 * 0.6;
    const y1 = top + (bottom - top) * u1 * u1 * 0.4 + (bottom - top) * u1 * 0.6;
    const inset = 96 * (1 - u1) + 4;
    rows.push({ y: y0, h: y1 - y0, inset });
  }
  return rows;
}
const TILE_ROWS = tileRows();

const StageBg = () => (
  <g>
    <defs>
      <linearGradient id="dsStageBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6E5E9C" />
        <stop offset="55%" stopColor={C.stage} />
        <stop offset="100%" stopColor="#8E7EB8" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={SW} height={SH} fill="url(#dsStageBg)" />
    {/* 幕布褶皱 */}
    {[14, 40, 66, 234, 260, 286].map((x, i) => (
      <rect key={i} x={x} y={0} width={16} height={520} fill={C.stageDeep} opacity={0.35} rx={8} />
    ))}
    <rect x={0} y={0} width={SW} height={62} fill={C.stageDeep} opacity={0.85} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <path key={i} d={`M ${i * 38} 62 q 19 26 38 0 Z`} fill={C.stageDeep} />
    ))}
    {/* 灯锥 */}
    <path d="M 150 118 L 34 402 L 266 402 Z" fill="#FFFFFF" opacity={0.10} />
    <path d="M 150 118 L 92 402 L 208 402 Z" fill="#FFFFFF" opacity={0.10} />
    {/* 镜面球 */}
    <line x1={150} y1={0} x2={150} y2={58} stroke="#EDE7FA" strokeWidth={2.6} />
    <circle cx={150} cy={92} r={36} fill={C.ball} stroke={INK} strokeWidth={3.4} />
    <g clipPath="url(#dsBallClip)">
      {[110, 126, 142, 158, 174].map((y, i) => (
        <rect key={i} x={112} y={y} width={76} height={7} fill="#B9AEE0" opacity={0.85} />
      ))}
      {[124, 142, 160, 178].map((x, i) => (
        <rect key={i} x={x} y={54} width={6} height={76} fill="#CFC6EC" opacity={0.7} />
      ))}
    </g>
    <clipPath id="dsBallClip">
      <circle cx={150} cy={92} r={35} />
    </clipPath>
    {/* 音箱 */}
    {[16, 250].map((x, i) => (
      <g key={i}>
        <rect x={x} y={318} width={34} height={80} rx={6} fill="#4A3E70" stroke={INK} strokeWidth={3} />
        <circle cx={x + 17} cy={344} r={10} fill="#2F2750" />
        <circle cx={x + 17} cy={374} r={12} fill="#2F2750" />
      </g>
    ))}
    {/* 地砖 */}
    <rect x={0} y={400} width={SW} height={SH - 400} fill="#5C4E8C" />
    {TILE_ROWS.map((r, ri) => (
      <g key={ri}>
        {Array.from({ length: 8 }).map((_, ci) => {
          const w = (SW - r.inset * 2) / 8;
          const x = r.inset + ci * w;
          const dark = (ri + ci) % 2 === 0;
          return (
            <rect
              key={ci} x={x} y={r.y} width={w + 0.6} height={r.h + 0.6}
              fill={dark ? C.tileB : C.tileA}
              opacity={dark ? 0.92 : 0.85}
            />
          );
        })}
      </g>
    ))}
    <rect x={0} y={396} width={SW} height={8} fill="#4A3E70" opacity={0.6} />
    {[[54, 210], [244, 244], [40, 300], [262, 152]].map(([x, y], i) => (
      <path
        key={i}
        transform={`translate(${x},${y})`}
        d="M 0 -11 L 2.6 -2.6 L 11 0 L 2.6 2.6 L 0 11 L -2.6 2.6 L -11 0 L -2.6 -2.6 Z"
        fill="#FFFFFF" opacity={0.6}
      />
    ))}
  </g>
);

// ------------------------------------------------------------------ 汇总
export const SCENE_DEFS: Array<[string, React.FC]> = [
  ['dsSceneNight', Night],
  ['dsSceneRamen', Ramen],
  ['dsSceneCat', Cat],
  ['dsSceneStageBg', StageBg],
];

export const SCENE_ID: Record<string, string> = {
  night: 'dsSceneNight',
  ramen: 'dsSceneRamen',
  cat: 'dsSceneCat',
  stage: 'dsSceneStageBg',
};

export const SceneDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: 'absolute', left: -9999, top: -9999 }} aria-hidden>
    <defs>
      {SCENE_DEFS.map(([id, Comp]) => (
        <g key={id} id={id}>
          <Comp />
        </g>
      ))}
    </defs>
  </svg>
);

/** 素材架缩略图用的取景框（约 4:3），保证四处缩略图看到的是同一套设计。 */
export const POSTER_VIEW: Record<string, string> = {
  night: '0 56 300 225',
  ramen: '0 44 300 225',
  cat: '20 176 260 195',
  stage: '0 30 300 225',
};

/** 按 id 引用素材。poster=true 时用取景框，否则显示整幅。 */
export const SceneUse: React.FC<{ scene: string; w: number; h: number; poster?: boolean; time?:number }> = ({
  scene, w, h, poster, time,
}) => (
  <svg
    width={w}
    height={h}
    viewBox={poster ? POSTER_VIEW[scene] ?? `0 0 ${SW} ${SH}` : `0 0 ${SW} ${SH}`}
    preserveAspectRatio="xMidYMid slice"
  >
    {time===undefined?<use href={`#${SCENE_ID[scene]}`} />:scene==='night'?<Night t={time}/>:scene==='ramen'?<Ramen t={time}/>:scene==='cat'?<Cat t={time}/>:<use href={`#${SCENE_ID[scene]}`} />}
  </svg>
);
