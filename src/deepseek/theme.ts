// 本片全部尺寸与配色常量。数值来自 reference-observations.md 的实量换算。
export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const DURATION = 918; // 30.6s

export const C = {
  paper: '#F4ECDD',
  paperDeep: '#EDE3D0',
  card: '#FBF6EB',
  cardEdge: '#C9C2AE',
  panel: '#FCF8EF',
  panelEdge: '#C2BBA7',
  line: '#B9B29E',
  ink: '#3F4A45',
  inkSoft: '#6F7568',
  muted: '#948E7C',
  faint: '#D8D2C0',

  green: '#5C8A63',
  greenMid: '#8FBB9B',
  greenSoft: '#CFE2CE',
  greenBtn: '#9CC6A6',

  yellow: '#EBD79B',
  yellowDeep: '#DCC271',
  pink: '#F0C8D0',
  lilac: '#CDC3E4',
  purple: '#4A3B5C',

  night: '#1E2A4A',
  night2: '#2C3E6B',
  night3: '#3A4E80',
  nightWin: '#F0D48A',
  moon: '#F2D98C',

  ramenBg: '#E8CBA4',
  ramenBg2: '#D9B487',
  bowl: '#EFE3D2',
  soup: '#7A4B3A',
  noodle: '#F0DCB4',

  catBg: '#BFDCCB',
  catBg2: '#A9CFBC',
  catFur: '#E9A05C',
  catFur2: '#D98B45',
  catCream: '#FBEBD6',

  stage: '#7B6BA8',
  stageDeep: '#5B4C86',
  stageLite: '#C9BCE8',
  tileA: '#D6CCEE',
  tileB: '#6E5EA0',
  ball: '#E4DCF6',

  timelinePurple: '#B9A8E0',
  playhead: '#E2703A',
  trash: '#9AA79C',

  whale: '#4B7BEC',
  whaleMist: '#A8C9ED',
  cream: '#FFF9E9',
  outline: '#253A52',
  coral: '#E8896B',
  shoe: '#2A4A7A',

  bubble: '#FFFDF6',
} as const;

export const FONT =
  '"Noto Sans SC", sans-serif';

export const L = {
  title: { x: 64, y: 66, size: 44 },
  subtitle: { right: 1866, y: 62, size: 26 },

  card: { x: 48, y: 96, w: 1824, h: 730 }, // 96..826
  headerH: 62,

  left: { x: 70, y: 180, w: 360, h: 626 }, // 180..806
  right: { x: 1382, y: 180, w: 430, h: 626 },

  phone: { cx: 960, w: 340, h: 612, top: 164 }, // 164..776

  groundY: 812, // 角色脚底
  charH: 160,

  tl: {
    x0: 90,
    x1: 1750, // 标尺 0:00 -> 0:16
    span: 16.0, // 标尺总秒数
    total: 16.4, // 内容总秒数
    rulerTop: 838,
    rulerLabelY: 866,
    tickTop: 874,
    tickBot: 884,
    textRow: { y: 892, h: 28 },
    clipRow: { y: 926, h: 64 },
    waveRow: { y: 996, h: 42 },
    beatRow: { y: 1034 },
    iconX: 48,
  },
} as const;

export const TL_SCALE = (L.tl.x1 - L.tl.x0) / L.tl.span; // px per second

export const tlX = (sec: number) => L.tl.x0 + sec * TL_SCALE;

// 右栏"饱和度"轨道量程与端点（手部接触点由它推出）
export const SAT = { x0: 1412, x1: 1740, max: 200 };
export const satKnobX = (v: number) => SAT.x0 + (SAT.x1 - SAT.x0) * Math.min(1, v / SAT.max);

// 所有"手套要按到的地方"的唯一真源；控件与时间轴的手部关键帧共用。
export const HOT = {
  tab: (i: number) => ({ x: 70 + 18 + i * 108 + 51, y: 180 + 24 + 26 }),
  asset: (col: number, row: number) => ({ x: 165 + col * 170, y: 364 + row * 186 }),
  effect: (col: number, row: number) => ({ x: 165 + col * 170, y: 348 + row * 104 }),
  text: (i: number) => ({ x: 250, y: 345 + i * 96 }),
  satKnob: (v: number) => ({ x: satKnobX(v), y: 421 }),
  autoBeat: { x: 1382 + 32 + 183, y: 180 + 510 + 34 },
  exportBtn: { x: 1719, y: 127 },
  trashDrop: { x: 1344, y: 700 },
} as const;
