// 全片唯一时间轴：所有动作、接触点、滑块、音效落点都从这里取数。
// 帧号 0..917（30fps，30.6s）。音效落点与 audio/cues.json 对齐。
import { FPS, HOT, tlX } from './theme';

export const sec = (frame: number) => frame / FPS;
export const fr = (t: number) => t * FPS;

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const smooth = (u: number) => {
  const x = clamp(u);
  return x * x * (3 - 2 * x);
};
export const easeOut = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
export const easeIn = (u: number) => Math.pow(clamp(u), 3);
export const easeInOut = (u: number) => {
  const x = clamp(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeBackOut = (u: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = clamp(u);
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
// 有超调的弹性，用于"惯性 + 缓冲"
export const easeElastic = (u: number) => {
  const x = clamp(u);
  if (x === 0 || x === 1) return x;
  return 1 - Math.pow(2, -9 * x) * Math.cos((x * 10 - 0.75) * ((2 * Math.PI) / 3));
};

/** 秒为单位的平滑关键帧插值；keys 必须按时间升序。 */
export function kf<T extends number | null>(
  t: number,
  keys: Array<[number, T]>,
  easing: (u: number) => number = smooth
): T {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t >= t0 && t <= t1) {
      if (v0 === null || v1 === null) return (t - t0 < t1 - t ? v0 : v1) as T;
      const u = easing((t - t0) / Math.max(1e-6, t1 - t0));
      return (v0 + (v1 - v0) * u) as T;
    }
  }
  return last[1];
}

/** 区间内的 0→1 进度，区间外为 0 / 1。 */
export const span = (t: number, a: number, b: number, easing = smooth) =>
  easing(clamp((t - a) / Math.max(1e-6, b - a)));

/** 只在 [a,b] 内为 1 的方波窗（带软边）。 */
export const win = (t: number, a: number, b: number, edge = 0.12) =>
  Math.min(span(t, a, a + edge), 1 - span(t, b - edge, b));

// ---------------------------------------------------------------- 段落
export interface Section {
  id: string;
  title: string;
  a: number; // 秒
  b: number;
}
export const SECTIONS: Section[] = [
  { id: 'intro', title: '把灵感拖进来', a: 0, b: 4.0 },
  { id: 'delete', title: '多余的，剪掉', a: 4.0, b: 7.0 },
  { id: 'transition', title: '转场，试一下', a: 7.0, b: 10.5 },
  { id: 'title', title: '错了？撤销就好', a: 10.5, b: 14.5 },
  { id: 'filter', title: '调出一点气氛', a: 14.5, b: 20.0 },
  { id: 'beat', title: '让画面踩上节拍', a: 20.0, b: 23.0 },
  { id: 'export', title: '最后，导出成片', a: 23.0, b: 26.5 },
  { id: 'final', title: '用 DeepSeek，把想法动起来', a: 26.5, b: 30.6 },
];

export const sectionAt = (t: number) =>
  SECTIONS.find((s) => t >= s.a && t < s.b) ?? SECTIONS[SECTIONS.length - 1];

// ---------------------------------------------------------------- 角色站位
// 值与参考图实量一致（见 reference-observations.md 第 7 节）。
const CHARX: Array<[number, number]> = [
  [0.0, 480], [0.3, 480],
  [1.35, 545], [2.15, 620], [2.95, 700], [3.75, 745], [3.98, 750],
  [4.12, 800], [4.38, 1155], [6.98, 1155],
  [7.16, 780], [7.42, 528], [14.42, 528],
  [14.68, 1180], [15.08, 1330], [16.40, 1440], [18.60, 1392], [20.08, 1392],
  [20.36, 1348], [23.06, 1348],
  [23.30, 1430], [26.06, 1430], [26.32, 1442], [26.58, 1472],
  [26.92, 1520], [27.28, 1632], [27.85, 1658], [30.6, 1658],
];
export const charX = (t: number) => kf(t, CHARX, easeInOut);

// ---------------------------------------------------------------- 手的目标
// null = 收在身侧。坐标是舞台绝对像素。
export type HandKey = [number, number | null, number | null];

// 手 A：主要操作手（伸向左栏 / 时间轴 / 垃圾桶 / 撤销）
const HAND_A: HandKey[] = [
  [0.00, null, null],
  [0.32, 165, 358],      // 伸向"城市夜景"缩略图
  [0.95, 165, 358],      // 抓住
  [1.35, tlX(1.6), 948],      // 落到时间轴第 1 格
  [1.50, null, null],
  [1.78, 335, 358],      // "热气拉面"
  [2.15, tlX(5.1), 948],
  [2.30, null, null],
  [2.58, 165, 544],      // "猫咪治愈"
  [2.95, tlX(8.6), 948],
  [3.10, null, null],
  [3.38, 335, 544],      // "小鲸舞台"
  [3.75, tlX(12.2), 948],
  [3.90, null, null],
  [4.20, null, null],
  [4.62, tlX(6.51), 948],      // 点选多余片段
  [5.00, tlX(6.51), 948],
  [5.42, tlX(6.51), 944],      // 抓起片段
  [6.18, HOT.trashDrop.x, HOT.trashDrop.y + 12],   // 送到垃圾桶口
  [6.42, HOT.trashDrop.x, HOT.trashDrop.y + 20],
  [6.62, null, null],
  [6.98, null, null],
  [7.16, HOT.tab(1).x, HOT.tab(1).y],      // 切到"特效"页签
  [7.42, HOT.tab(1).x, HOT.tab(1).y],
  [7.98, HOT.effect(1, 0).x, HOT.effect(1, 0).y],   // "翻转"
  [8.20, HOT.effect(1, 0).x, HOT.effect(1, 0).y],
  [8.62, null, null],
  [8.95, HOT.effect(1, 1).x, HOT.effect(1, 1).y],   // "故障"
  [9.20, HOT.effect(1, 1).x, HOT.effect(1, 1).y],
  [9.52, HOT.effect(1, 1).x, HOT.effect(1, 1).y],
  [9.95, null, null],
  [10.30, null, null],
  [10.72, HOT.tab(2).x, HOT.tab(2).y],     // "文字"页签
  [10.95, HOT.tab(2).x, HOT.tab(2).y],
  [11.02, HOT.text(0).x, HOT.text(0).y],   // "前方高能"
  [11.30, HOT.text(0).x, HOT.text(0).y],
  [11.48, null, null],
  [14.45, null, null],
  [20.38, null, null],
  [23.30, null, null],
  [26.06, null, null],
  [27.05, null, null],
  [30.6, null, null],
];

// 手 B：辅助手 / 伸向右栏按钮与导出
const HAND_B: HandKey[] = [
  [0.00, null, null],
  [3.90, null, null],
  [4.20, 700, 940],
  [4.62, 700, 940],
  [5.10, null, null],
  [7.16, null, null],
  [14.45, null, null],
  [20.18, HOT.autoBeat.x, HOT.autoBeat.y],   // "自动卡点"
  [20.40, HOT.autoBeat.x, HOT.autoBeat.y + 6],
  [20.70, null, null],
  [23.10, null, null],
  [23.18, HOT.exportBtn.x, HOT.exportBtn.y],   // 点"导出"
  [23.38, HOT.exportBtn.x, HOT.exportBtn.y + 6],
  [23.70, null, null],
  [26.10, null, null],
  [26.55, null, null],
  [27.20, null, null],
  [30.6, null, null],
];

export interface HandState {
  x: number | null;
  y: number | null;
}
export const handA = (t: number): HandState => {
  // Return from the bin, make contact, then move with the exact clip edge.
  if(t>=6.42&&t<6.62){const u=span(t,6.42,6.62,easeInOut);return {x:lerp(HOT.trashDrop.x,tlX(clipsAt(t)[2].start)+18,u),y:lerp(HOT.trashDrop.y+20,948,u)-38*Math.sin(u*Math.PI)};}
  if(t>=6.62&&t<=6.96){const p=clipsAt(t)[2];return {x:tlX(p.start)+18,y:948};}
  if(t>6.96&&t<7.10){const u=span(t,6.96,7.10);return {x:lerp(tlX(clipsAt(t)[2].start)+18,charX(t)+30,u),y:lerp(948,740,u)};}

  const kx = kf(t, HAND_A.map((k) => [k[0], k[1]] as [number, number | null]), easeOut);
  const ky = kf(t, HAND_A.map((k) => [k[0], k[2]] as [number, number | null]), easeOut);

  // 滤镜段：手套圆心严格等于"饱和度"滑块圆点坐标，全程同坐标不漂移
  if (t >= 15.00 && t <= 18.80) {
    const p = HOT.satKnob(saturationAt(t));
    return { x: p.x, y: p.y };
  }
  // 从身侧伸过去 / 松手收回
  if (t > 14.62 && t < 15.00) {
    const u = easeOut((t - 14.62) / 0.38);
    const p = HOT.satKnob(saturationAt(15.00));
    return { x: lerp(1424, p.x, u), y: lerp(716, p.y, u) };
  }
  if (t > 18.80 && t < 19.30) {
    const u = easeIn((t - 18.80) / 0.50);
    const p = HOT.satKnob(saturationAt(18.80));
    return { x: lerp(p.x, p.x + 26, u), y: lerp(p.y, p.y + 150, u) };
  }
  // 撤销：手套按在角色身前，与身体同步移动
  if (t >= 12.80 && t <= 13.14) {
    return { x: charX(t) + 6, y: 690 };
  }
  if (t > 13.14 && t < 13.40) {
    const u = easeIn((t - 13.14) / 0.26);
    return { x: charX(t) + 6 + 20 * u, y: 690 + 80 * u };
  }
  // 起跳庆祝：双臂张开上举，围巾与尾鳍延迟
  const up = armUpAt(t);
  if (up > 0) return { x: charX(t) - 38 - 70 * up, y: 765 - 130 * up };
  return { x: kx, y: ky };
};

/** 起跳时双臂上举的进度（0=垂在身侧） */
export const armUpAt = (t: number): number => {
  if (t <= 26.28 || t >= 27.20) return 0;
  return Math.min(span(t, 26.28, 26.52, easeOut), 1 - span(t, 26.90, 27.20, easeOut));
};
export const handB = (t: number): HandState => {
  const up = armUpAt(t);
  if (up > 0) return { x: charX(t) + 38 + 70 * up, y: 765 - 130 * up };
  return {
    x: kf(t, HAND_B.map((k) => [k[0], k[1]] as [number, number | null]), easeOut),
    y: kf(t, HAND_B.map((k) => [k[0], k[2]] as [number, number | null]), easeOut),
  };
};

// ---------------------------------------------------------------- 面朝方向
export const facing = (t: number): 1 | -1 => {
  // 面向正在操作的对象（决定头与眼神朝向）
  if (t < 4.1) return -1;                 // 左栏
  if (t < 7.0) return 1;                  // 垃圾桶在右
  if (t < 10.5) return -1;                // 左栏特效
  if (t < 14.5) return -1;                // 左栏文字
  if (t < 20.0) return 1;                 // 右侧滑块
  if (t < 26.5) return 1;
  return 1;
};

// ---------------------------------------------------------------- 表情
export type Expr =
  | 'neutral' | 'happy' | 'think' | 'surprise' | 'satisfied' | 'focus' | 'wow' | 'proud';

export const exprAt = (t: number): Expr => {
  // 惊讶
  if (t > 9.42 && t < 10.20) return 'surprise';
  if (t > 16.55 && t < 17.35) return 'surprise';
  // 满意眨眼
  if (t > 13.90 && t < 14.45) return 'satisfied';
  if (t > 18.55 && t < 19.80) return 'satisfied';
  if (t > 6.75 && t < 7.05) return 'satisfied';
  // 开心
  if (t > 26.90 && t < 30.6) return 'proud';
  if (t > 4.0 && t <= 4.2) return 'happy';
  // 思考
  if ((t > 11.90 && t < 12.55) || (t > 25.86 && t < 26.12)) return 'think';
  // 专注
  if (t > 5.30 && t < 6.60) return 'focus';
  if (t > 15.0 && t < 16.55) return 'focus';
  if (t > 17.0 && t < 18.60) return 'focus';
  if (t > 23.2 && t < 25.9) return 'focus';
  if (t > 8.6 && t < 9.42) return 'happy';
  if (t > 10.9 && t < 11.6) return 'happy';
  return 'neutral';
};

// 眼睛眨眼（0=张开，1=闭合）
export const blinkAt = (t: number): number => {
  const blinks = [1.62, 3.12, 4.62, 6.62, 8.42, 10.12, 12.32, 14.32, 17.62, 19.12, 22.12, 24.52, 27.42, 29.12];
  let b = 0;
  for (const c of blinks) {
    const d = Math.abs(t - c);
    if (d < 0.12) b = Math.max(b, 1 - d / 0.12);
  }
  return b;
};

// 单眼眨眼（满意时）
export const winkAt = (t: number): number => {
  if (t > 13.92 && t < 14.22) return 1;
  if (t > 18.58 && t < 18.86) return 1;
  if (t > 6.76 && t < 6.94) return 1;
  return 0;
};

// ---------------------------------------------------------------- 身体状态
export const crouchAt = (t: number): number => {
  // 预蹲 / 落地压缩
  if (t >= 26.06 && t < 26.32) return 0.82 * span(t, 26.06, 26.20) * (1 - span(t, 26.24, 26.32, easeIn));
  if (t >= 26.74 && t < 27.02) return 0.82 * span(t, 26.74, 26.80) * (1 - span(t, 26.82, 27.02));
  if (t >= 9.44 && t < 9.72) return 0.7 * span(t, 9.44, 9.52) * (1 - span(t, 9.58, 9.72));
  return 0;
};

export const jumpAt = (t: number): number => {
  // 返回离地高度（像素）
  if (t < 26.32 || t > 26.86) return 0;
  const u = (t - 26.32) / 0.54;
  if (u < 0 || u > 1) return 0;
  return Math.sin(Math.PI * u) * 92;
};

export const tiltAt = (t: number): number => {
  // 身体倾斜（度）
  if (t > 26.32 && t < 26.88) {
    const u = (t - 26.32) / 0.56;
    return -10 * Math.sin(Math.PI * u);
  }
  if (t > 5.30 && t < 6.42) return 8 * win(t, 5.38, 6.30, 0.2);
  if (t > 15.0 && t < 16.5) return -6 * win(t, 15.06, 16.44, 0.16);
  if (t > 17.0 && t < 18.5) return 5 * win(t, 17.06, 18.44, 0.16);
  return 0;
};

// 围巾与尾鳍延迟跟随（1 拍 = 0.5s）
export const tailLag = (t: number): number => {
  const drive = (tt: number) => {
    // 身体横向速度近似
    const a = charX(tt - 0.09);
    const b = charX(tt + 0.02);
    return clamp((b - a) / 190, -1, 1);
  };
  return drive(t);
};

// ---------------------------------------------------------------- 左栏
export type LeftTab = 'asset' | 'effect' | 'text';
export const leftTabAt = (t: number): LeftTab => {
  if (t < 7.10) return 'asset';
  if (t < 10.62) return 'effect';
  return 'text';
};

// "特效"页里正在试的按钮：翻转 -> 故障
export const effectHotAt = (t: number): string | null => {
  if (t < 7.9) return null;
  if (t < 8.9) return 'flip';
  return 'glitch';
};

// "文字"页里被按下/生效的按钮
export const textHotAt = (t: number): string | null => {
  if (t < 11.0) return null;
  return 'power';
};

// ---------------------------------------------------------------- 右栏滑块
// 轨道量程 0–200%（见 reference-observations.md 第 4 节）
export const saturationAt = (t: number): number => {
  if (t < 15.02) return 90;
  if (t < 16.40) return lerp(90, 200, smooth((t - 15.02) / 1.38));
  if (t < 16.95) return 200;
  if (t < 18.42) return lerp(200, 113, smooth((t - 16.95) / 1.47));
  return 113;
};
export const slidersAt = (t: number) => ({
  brightness: 65,
  saturation: saturationAt(t),
  grain: 28,
  speed: 1.0,
});

export const autoBeatOn = (t: number) => t >= 20.42;

// ---------------------------------------------------------------- 时间轴内容
export interface ClipDef {
  id: string;
  label: string;
  start: number; // 标尺秒
  dur: number;
}
export const CLIPS_BASE: ClipDef[] = [
  {id:'night',label:'夜景.mp4',start:0,dur:3.2},
  {id:'ramen',label:'拉面.mp4',start:3.2,dur:3.8},
  {id:'cat',label:'小猫.mp4',start:7,dur:3.2},
  {id:'stage',label:'舞台.mp4',start:10.2,dur:4},
];

// 落入时间（与手部关键帧一致）
export const CLIP_DROP = [1.35, 2.15, 2.95, 3.75];
// 删除：从"拉面"里剪掉中间一段，前后两段合拢
const CUT_A = 6.02;   // 剪掉段起点（标尺秒）
export const CUT_LEN = 0.98; // 剪掉长度
const RAMEN_END = 7.0;
const CUT_B = CUT_A + CUT_LEN; // 6.60

export interface ClipSeg {
  key: string;
  id: string;
  label: string;
  start: number;
  dur: number;
  drop: number;
  visible: number;
  highlight: number;
  showLabel: boolean;
}

export const clipsAt = (t: number): ClipSeg[] => {
  let start=0;
  const close=span(t,6.62,6.96,easeInOut);
  return CLIPS_BASE.map((c,i)=>{
    const dur=c.dur-(i===1?CUT_LEN*close:0);
    const seg={key:c.id,id:c.id,label:c.label,start,dur,drop:CLIP_DROP[i],
      visible:span(t,CLIP_DROP[i],CLIP_DROP[i]+.12),showLabel:true,
      highlight:i===1?win(t,4.58,6.36,.14):0};
    start+=dur;return seg;
  });
};

// 被剪掉的片段本体（选中框 + 飞向垃圾桶的小卡片）
export const cutScrapAt = (t: number) => {
  const sel = win(t, 5.66, 6.44, 0.08);
  if (sel <= 0) return null;
  return { a: CUT_A, len: CUT_LEN, sel, fly: span(t, 5.62, 6.36, easeInOut) };
};

// 文字轨
export const textClipAt = (t: number) => {
  if (t < 11.02) return null;
  const appear = span(t, 11.02, 11.34, easeBackOut);
  const gone = span(t, 13.02, 13.26, easeIn);
  const a = 1 - gone;
  if (a <= 0.001) return null;
  return { appear, alpha: a, y: -18 * gone };
};

// 卡点标记：位置是"标尺秒"（成片内容时间），不是本片时间
export const BEAT_MARKS = Array.from({ length: 33 }, (_, i) => 0.25 + i * 0.5);
export const beatMarksAt = (t: number) => {
  const sweep = span(t, 20.42, 21.60, easeOut) * BEAT_MARKS.length;
  const out: Array<{ t: number; u: number }> = [];
  BEAT_MARKS.forEach((s, i) => {
    const u = clamp(sweep - i);
    if (u > 0) out.push({ t: s, u });
  });
  return out;
};

// Content position is authoritative; phone scene and local time are resolved from it.
export const playbackAt=(t:number)=>{
 const clips=clipsAt(t);let selected=0,age=0;
 if(t<4.3){for(let i=0;i<4;i++)if(t>=CLIP_DROP[i]){selected=i;age=t-CLIP_DROP[i];}}
 else if(t<7.05){selected=1;age=.65+(t-4.3)*.72;}
 else if(t<10.62){selected=0;age=(t-7.05)%3.2;}
 else if(t<14.62){selected=2;age=(t-10.62)%3.2;}
 else{selected=3;age=(t-14.62)%4;}
 const c=clips[selected];const position=c.start+Math.min(c.dur-1/300,Math.max(0,age));
 const hit=clips.find(c=>position>=c.start&&position<c.start+c.dur)!;
 return {position,scene:hit.id as SceneId,localTime:position-hit.start,ready:t>=CLIP_DROP[0]};
};
export const playheadAt=(t:number)=>playbackAt(t).position;

// ---------------------------------------------------------------- 手机
export type SceneId = 'empty' | 'night' | 'ramen' | 'cat' | 'stage';
export interface PhoneState {
  scene: SceneId;
  localTime: number;
  prevScene: SceneId;
  sceneIn: number;       // 场景切换淡入
  cutPiece: number;      // 0..1 处于"多余片段"状态
  goodPart: number;      // 0..1 显示"今天，嗦一口！"
  title: number;         // 0..1 标题胶囊
  flip: number;          // -1..1 翻转转场
  glitch: number;        // 0..1 故障强度
  dance: number;         // 0..1 律动
  confetti: number;      // 0..1 纸屑
  done: number;          // 0..1 "搞定了！"
  finished: number;      // 0..1 成片定格
}

export const phoneAt = (t: number): PhoneState => {
  const state=playbackAt(t);
  const scene:SceneId=state.ready?state.scene:'empty';
  const prevScene:SceneId='empty';
  const sceneIn=state.ready?1:0;
  return {
    scene,
    prevScene,
    sceneIn,
    localTime:state.localTime,
    cutPiece: win(t, 5.02, 6.44, 0.16),
    goodPart: span(t, 6.62, 6.94, easeBackOut) * (1 - span(t, 7.06, 7.30)),
    title: span(t, 11.02, 11.34, easeBackOut) * (1 - span(t, 13.02, 13.26, easeIn)),
    flip: t > 8.02 && t < 8.72 ? Math.sin(Math.PI * clamp((t - 8.02) / 0.70)) * 2 : 0,
    glitch: win(t, 9.16, 10.10, 0.14),
    dance: span(t, 20.50, 20.90) * (1 - span(t, 26.40, 26.70)),
    confetti: span(t, 26.50, 26.62),
    done: span(t, 27.10, 27.40, easeBackOut),
    finished: span(t, 25.40, 25.80),
  };
};

// ---------------------------------------------------------------- 导出状态
export const exportAt = (t: number) => {
  if (t < 23.32) return { active: false, progress: 0, done: false };
  if (t < 25.40) {
    return { active: true, progress: clamp((t - 23.32) / 2.08), done: false };
  }
  return { active: true, progress: 1, done: true };
};

// ---------------------------------------------------------------- 垃圾桶
export const trashAt = (t: number) => {
  const show = span(t, 4.60, 4.90) * (1 - span(t, 6.95, 7.15));
  const lid = span(t, 6.28, 6.42, easeOut) * (1 - span(t, 6.60, 6.78));
  const swallow = win(t, 6.36, 6.72, 0.08);
  return { show, lid, swallow };
};

// ---------------------------------------------------------------- 气泡
export interface Bubble { text: string; a: number; b: number; x: number; y: number; tail: 'l' | 'r' }
export const BUBBLES: Bubble[] = [
  { text: '有点……太亮了！', a: 16.84, b: 18.10, x: 1500, y: 470, tail: 'r' },
  { text: '这个转场不对', a: 9.60, b: 10.40, x: 400, y: 470, tail: 'l' },
];
export const bubbleAt = (t: number) =>
  BUBBLES.map((b) => ({ ...b, k: Math.min(span(t, b.a, b.a + 0.18, easeBackOut), 1 - span(t, b.b - 0.18, b.b)) }));

// ---------------------------------------------------------------- 标题与字幕
export const headlineAt = (t: number) => sectionAt(t).title;

// 时间码：全局帧的 秒:帧
export const timecodeAt = (t: number) => {
  const total = Math.floor(playheadAt(t) * FPS);
  const s = Math.floor(total / FPS);
  const f = total % FPS;
  return `${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};

// ---------------------------------------------------------------- 成片卡
export const madeWithAt = (t: number) => span(t, 27.55, 28.00, easeBackOut);
export const finalStickerAt = (t: number) => (t >= 27.35 ? 1 : 0);
