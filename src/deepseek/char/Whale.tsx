// DeepSeek 小鲸导演：按 角色设定.md 的几何描述从零绘制。
// 本地坐标系 200 × 268，脚底在 y=250，地面锚点 (100,250)。
// 头 / 躯干 / 腿脚 ≈ 43% / 30% / 29%，头宽 ≈ 躯干宽 ×1.45。
import React from 'react';
import { C } from '../theme';
import type { Expr } from '../timeline';

export const LOCAL_H = 250;
export const LOCAL_FEET = { x: 100, y: 250 };

export interface Hand {
  x: number;
  y: number;
}

export interface WhaleProps {
  x: number;
  y: number; // 脚底舞台坐标
  h: number; // 屏幕高度
  expr: Expr;
  blink: number;
  wink: number;
  gaze: { x: number; y: number };
  headTilt: number;
  bodyTilt: number;
  squash: number; // 1 = 常态，<1 纵向压扁
  handA: Hand | null;
  handB: Hand | null;
  finLag: number;
  facing: 1 | -1;
  showArms?: boolean;
  /** 常态呼吸相位：-1..1，让角色一直在轻微起伏，不留死帧 */
  idle?: number;
}

const INK = C.outline;
const BLUE = C.whale;
const MIST = C.whaleMist;
const CREAM = C.cream;
const CORAL = C.coral;
const SHOE = C.shoe;

// 肩关节（本地坐标）
const SH_A = { x: 52, y: 122 };
const SH_B = { x: 148, y: 122 };

/** 把舞台坐标换算成本地坐标 */
function toLocal(hx: number, hy: number, x: number, y: number, s: number) {
  return { x: (hx - x) / s + 100, y: (hy - y) / s + 250 };
}

/** 手臂：从肩到手套的连续实体软管，带描边与轻微拉伸收细。 */
function Arm({
  sh,
  hand,
  bendSign,
  width = 26,
}: {
  sh: { x: number; y: number };
  hand: { x: number; y: number };
  bendSign: number;
  width?: number;
}) {
  const dx = hand.x - sh.x;
  const dy = hand.y - sh.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  const bend = Math.min(74, len * 0.20) * bendSign;
  const cx = (sh.x + hand.x) / 2 + nx * bend;
  const cy = (sh.y + hand.y) / 2 + ny * bend;
  const k = Math.max(0.62, Math.min(1, 1 - (len - 130) / 950));
  const wOut = width * k;
  const wIn = (width - 8) * k;
  const d = `M ${sh.x} ${sh.y} Q ${cx} ${cy} ${hand.x} ${hand.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={wOut} strokeLinecap="round" />
      <path d={d} fill="none" stroke={BLUE} strokeWidth={wIn} strokeLinecap="round" />
      {/* 软管上的两道浅色折痕，说明是实体不是光线 */}
      <path
        d={d}
        fill="none"
        stroke={MIST}
        strokeWidth={Math.max(1.6, 3.2 * k)}
        strokeLinecap="round"
        strokeDasharray={`${10 * k} ${16 * k}`}
        opacity={0.55}
      />
    </g>
  );
}

/** 奶白圆手套，掌心和简化拇指可辨认。 */
function Glove({ at, angle }: { at: { x: number; y: number }; angle: number }) {
  const r = 21;
  return (
    <g transform={`translate(${at.x},${at.y}) rotate(${angle})`}>
      <ellipse cx={-r * 0.62} cy={r * 0.42} rx={8.5} ry={7} fill={CREAM} stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={0} r={r} fill={CREAM} stroke={INK} strokeWidth={4.5} />
      <path
        d={`M ${-r * 0.45} ${r * 0.1} Q 0 ${r * 0.42} ${r * 0.45} ${r * 0.1}`}
        fill="none"
        stroke={INK}
        strokeWidth={2.6}
        strokeLinecap="round"
        opacity={0.5}
      />
    </g>
  );
}

export const Whale: React.FC<WhaleProps> = ({
  x,
  y,
  h,
  expr,
  blink,
  wink,
  gaze,
  headTilt,
  bodyTilt,
  squash,
  handA,
  handB,
  finLag,
  facing,
  showArms = true,
  idle = 0,
}) => {
  const s = h / LOCAL_H;
  const sq = Math.max(0.84, Math.min(1.10, squash));
  const gx = Math.max(-1, Math.min(1, gaze.x)) * 4.2;
  const gy = Math.max(-1, Math.min(1, gaze.y)) * 3.4;

  const happy = expr === 'happy' || expr === 'proud';
  const proud = expr === 'proud';
  const surprised = expr === 'surprise';
  const satisfied = expr === 'satisfied';
  const thinking = expr === 'think';
  const focus = expr === 'focus' || expr === 'neutral';

  const eyeOpen = (1 - blink) * (1 - (satisfied ? 0 : 0));
  const mouthOpen = proud ? 1 : happy ? 0.5 : surprised ? 0 : 0;

  const L = handA ? toLocal(handA.x, handA.y, x, y, s) : null;
  const R = handB ? toLocal(handB.x, handB.y, x, y, s) : null;

  // 收在身侧时的默认手位
  const restA = { x: 40 - idle * 3.2, y: 176 + idle * 5.0 };
  const restB = { x: 160 + idle * 3.2, y: 176 + idle * 5.0 };
  const lHand = L ?? restA;
  const rHand = R ?? restB;

  return (
    <g transform={`translate(${x},${y}) scale(${s}) translate(${-100},${-250})`}>
      <g transform={`translate(100,250) scale(${(1 / sq).toFixed(4)},${sq.toFixed(4)}) translate(-100,-250)`}>
        {/* 影子：随呼吸微微收放 */}
        <ellipse cx={100} cy={252} rx={62 - idle * 1.6} ry={11 - idle * 0.6} fill={INK} opacity={0.13} />
      </g>
      <g
        transform={`translate(100,250) rotate(${bodyTilt}) translate(-100,-250)`}
      >
        <g transform={`translate(100,250) scale(${(1 / sq).toFixed(4)},${sq.toFixed(4)}) translate(-100,-250)`}>
          {/* 手臂先画，肩部被躯干盖住，保证连续 */}
          {showArms && (
            <>
              <Arm sh={SH_A} hand={lHand} bendSign={1} />
              <Arm sh={SH_B} hand={rHand} bendSign={-1} />
            </>
          )}

          {/* 背后的胶片卷 */}
          <g transform="translate(44,138)">
            <circle r={13} fill={CREAM} stroke={INK} strokeWidth={3.4} />
            <circle r={4.4} fill={INK} opacity={0.55} />
          </g>

          {/* 腿 */}
          <path d="M 72 172 L 95 172 L 95 226 Q 83 232 72 226 Z" fill={BLUE} stroke={INK} strokeWidth={4} />
          <path d="M 105 172 L 128 172 L 128 226 Q 117 232 105 226 Z" fill={BLUE} stroke={INK} strokeWidth={4} />
          {/* 鞋 */}
          <path
            d="M 58 226 Q 58 214 74 214 L 96 214 Q 100 214 100 222 L 100 244 Q 100 252 88 252 L 68 252 Q 58 252 58 242 Z"
            fill={SHOE} stroke={INK} strokeWidth={4}
          />
          <path
            d="M 142 226 Q 142 214 126 214 L 104 214 Q 100 214 100 222 L 100 244 Q 100 252 112 252 L 132 252 Q 142 252 142 242 Z"
            fill={SHOE} stroke={INK} strokeWidth={4}
          />

          {/* 躯干（纸偶身体，暖奶色） */}
          <path
            d="M 52 108 Q 100 98 148 108 L 150 166 Q 100 180 50 166 Z"
            fill="#F2E4C8" stroke={INK} strokeWidth={4.2}
          />
          {/* 导演背心：V 领 + 两枚蓝扣子 */}
          <path
            d="M 55 111 Q 76 104 86 120 L 100 138 L 114 120 Q 124 104 145 111 L 146 150 Q 100 163 54 150 Z"
            fill={CREAM} stroke={INK} strokeWidth={3.4}
          />
          <circle cx={86} cy={147} r={5.2} fill={BLUE} stroke={INK} strokeWidth={2.6} />
          <circle cx={114} cy={147} r={5.2} fill={BLUE} stroke={INK} strokeWidth={2.6} />

          {/* 珊瑚色围巾结（随身体延迟摆动） */}
          <g transform={`translate(100,102) rotate(${finLag * -7}) translate(-100,-102)`}>
            <path
              d="M 84 96 Q 100 108 116 96 Q 113 108 100 112 Q 87 108 84 96 Z"
              fill={CORAL} stroke={INK} strokeWidth={3.4}
            />
            <path
              d="M 88 106 Q 80 120 84 130 L 96 127 Q 93 116 98 106 Z"
              fill={CORAL} stroke={INK} strokeWidth={3.2}
            />
          </g>

          {/* 头（以颈部为转轴） */}
          <g
            transform={`translate(100,110) rotate(${headTilt + finLag * 4}) translate(-100,-110)`}
          >
            {/* 头后小尾鳍 */}
            <path
              d="M 150 74 C 158 50, 176 34, 190 38 C 200 41, 198 54, 188 62 C 200 64, 208 76, 202 86 C 194 98, 168 94, 150 82 Z"
              fill={MIST} stroke={INK} strokeWidth={3.6}
            />
            <path d="M 172 74 C 180 68, 188 64, 192 64" fill="none" stroke={INK} strokeWidth={2} opacity={0.4} />

            {/* 头部主体 */}
            <path
              d="M 100 2 C 144 2, 172 24, 174 52 C 176 78, 166 96, 146 103 C 124 110, 76 110, 54 103 C 34 96, 24 78, 26 52 C 28 24, 56 2, 100 2 Z"
              fill={BLUE} stroke={INK} strokeWidth={4.6}
            />
            {/* 额头高光 */}
            <path
              d="M 62 26 C 78 14, 118 12, 138 22"
              fill="none" stroke={MIST} strokeWidth={5} strokeLinecap="round" opacity={0.55}
            />

            {/* 奶白下颌 */}
            <path
              d="M 56 76 C 68 100, 132 100, 144 76 C 147 94, 128 107, 100 107 C 72 107, 53 94, 56 76 Z"
              fill={CREAM} stroke={INK} strokeWidth={3.8}
            />

            {/* 腮红 */}
            {(happy || satisfied || proud) && (
              <>
                <ellipse cx={52} cy={74} rx={9} ry={5.2} fill={CORAL} opacity={0.45} />
                <ellipse cx={148} cy={74} rx={9} ry={5.2} fill={CORAL} opacity={0.45} />
              </>
            )}

            {/* 眉（思考/惊讶时露出） */}
            {(thinking || surprised) && (
              <>
                <path
                  d={thinking ? 'M 62 34 Q 72 28 82 33' : 'M 62 30 Q 72 25 82 30'}
                  fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round"
                />
                <path
                  d={thinking ? 'M 118 30 Q 128 26 138 32' : 'M 118 30 Q 128 25 138 30'}
                  fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round"
                />
              </>
            )}

            {/* 眼睛 */}
            {[
              { cx: 72, mirror: 1, closed: wink > 0.5 && facing < 0 ? 1 : 0 },
              { cx: 128, mirror: -1, closed: wink > 0.5 && facing > 0 ? 1 : 0 },
            ].map((e, i) => {
              const ry = surprised ? 15.5 : 12.5;
              const open = Math.max(0.06, eyeOpen - e.closed);
              const smiling = happy || proud;
              return (
                <g key={i}>
                  {smiling && open > 0.4 ? (
                    <path
                      d={`M ${e.cx - 11} 54 Q ${e.cx} 38 ${e.cx + 11} 54`}
                      fill="none" stroke={INK} strokeWidth={5.4} strokeLinecap="round"
                    />
                  ) : (
                    <>
                      <ellipse cx={e.cx} cy={52} rx={surprised ? 13 : 10.5} ry={ry * open} fill={INK} />
                      {open > 0.5 && (
                        <circle cx={e.cx + gx + e.mirror * 2} cy={48 + gy} r={3.6} fill="#FFFFFF" opacity={0.9} />
                      )}
                    </>
                  )}
                  {thinking && i === 0 && (
                    <circle cx={e.cx + gx} cy={54 + gy} r={3.2} fill="#FFFFFF" opacity={open > 0.5 ? 0.85 : 0} />
                  )}
                </g>
              );
            })}

            {/* 嘴 */}
            {surprised ? (
              <ellipse cx={100} cy={86 + gy * 0.4} rx={7.5} ry={9} fill={INK} />
            ) : proud ? (
              <>
                <path d="M 84 76 Q 100 100 116 76 Z" fill={INK} />
                <path d="M 94 92 Q 100 98 106 92" fill="none" stroke={CORAL} strokeWidth={3.4} strokeLinecap="round" />
              </>
            ) : happy ? (
              <>
                <path d="M 86 77 Q 100 94 114 77 Z" fill={INK} />
              </>
            ) : satisfied ? (
              <path d="M 88 82 Q 101 90 114 76" fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />
            ) : thinking ? (
              <path d="M 90 84 Q 100 81 111 83" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
            ) : (
              <path d="M 88 80 Q 100 88 112 80" fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />
            )}

            {/* 惊讶时的小汗滴 */}
            {surprised && (
              <path d="M 158 60 Q 164 70 160 76 Q 154 72 158 60 Z" fill={MIST} stroke={INK} strokeWidth={2.4} />
            )}
          </g>
        </g>

        {/* 手套画在最上层，保证与目标同坐标可见 */}
        {showArms && (
          <>
            <Glove at={lHand} angle={-18} />
            <Glove at={rHand} angle={18} />
          </>
        )}
        {!showArms && <Glove at={lHand} angle={-18} />}
      </g>
    </g>
  );
};
