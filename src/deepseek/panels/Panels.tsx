// 工作台外壳、左栏素材抽屉、右栏调整控件。
import React from 'react';
import { C, L, FONT } from '../theme';
import { SceneUse, SW, SH } from '../phone/scenes';
import type { LeftTab } from '../timeline';
import { clamp } from '../timeline';

const INK = C.outline;

const box = (o: React.CSSProperties): React.CSSProperties => ({
  position: 'absolute', boxSizing: 'border-box', fontFamily: FONT, ...o,
});

const label: React.CSSProperties = {
  fontFamily: FONT, color: C.ink, fontWeight: 700,
};

// ------------------------------------------------------------ 顶部标题
export const Headline: React.FC<{ text: string; appear: number }> = ({ text, appear }) => (
  <div
    style={box({
      left: L.title.x, top: L.title.y - L.title.size,
      fontSize: L.title.size, fontWeight: 900, letterSpacing: 3,
      color: '#333F3A', lineHeight: 1,
      opacity: appear, transform: `translateY(${(1 - appear) * -14}px)`,
      whiteSpace: 'nowrap',
    })}
  >
    {text}
  </div>
);

export const Subtitle: React.FC = () => (
  <div
    style={box({
      right: 1920 - L.subtitle.right, top: L.subtitle.y - L.subtitle.size,
      fontSize: L.subtitle.size, color: C.muted, letterSpacing: 1.5, lineHeight: 1,
    })}
  >
    手绘工作台 · DeepSeek 小鲸导演
  </div>
);

// ------------------------------------------------------------ 卡片与标题栏
export const Card: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    style={box({
      left: L.card.x, top: L.card.y, width: L.card.w, height: L.card.h,
      background: C.card, borderRadius: 22,
      border: `2px solid ${C.cardEdge}`,
      boxShadow: '0 6px 0 rgba(63,74,69,0.06)',
    })}
  >
    {/* 纸张的轻微内层感 */}
    <div
      style={{
        position: 'absolute', inset: 0, borderRadius: 22, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 40%)',
      }}
    />
    {children}
  </div>
);

export const CardHeader: React.FC<{
  timecode: string;
  exportState: { active: boolean; progress: number; done: boolean };
}> = ({ timecode, exportState }) => {
  const btnBg = exportState.done ? C.yellow : exportState.active ? '#F2E3B4' : C.greenBtn;
  const btnText = exportState.done
    ? `✓ 已完成`
    : exportState.active
      ? `渲染中 ${Math.round(exportState.progress * 100)}%`
      : `⤓ 导出`;
  return (
    <>
      <div style={box({ left: L.card.x, top: L.card.y, width: L.card.w, height: L.headerH })}>
        {[C.coral, '#E9C46A', '#8FBF8F'].map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', left: 34 + i * 24, top: 23, width: 15, height: 15,
              borderRadius: 8, background: c, opacity: 0.85,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute', left: 112, top: 18, fontSize: 27, fontWeight: 700,
            color: C.ink, letterSpacing: 0.6, whiteSpace: 'nowrap',
          }}
        >
          我的第一支动画 <span style={{ color: C.muted, fontWeight: 500 }}>/ 小鲸 studio</span>
        </div>
        {/* 时间码 */}
        <div
          style={{
            position: 'absolute', left: L.card.x + L.card.w / 2 - 43 - 4, top: 14,
            width: 236, height: 44, borderRadius: 22, background: '#2B2F2C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#F6F2E6', fontSize: 25, fontWeight: 700, letterSpacing: 2,
          }}
        >
          {timecode}
        </div>
        <div
          style={{
            position: 'absolute', right: 1920 - 1592, top: 22, fontSize: 25,
            color: C.ink, fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          1080p
        </div>
        <div
          style={{
            position: 'absolute', right: 1920 - 1842, top: 9, width: 246, height: 44,
            borderRadius: 22, background: btnBg, border: `2px solid rgba(63,74,69,0.28)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#2E3A34', letterSpacing: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${exportState.progress * 100}%`,
              background: 'rgba(92,138,99,0.30)',
            }}
          />
          <span style={{ position: 'relative' }}>{btnText}</span>
        </div>
        <div
          style={{
            position: 'absolute', left: 20, right: 20, top: L.headerH - 2, height: 2,
            background: C.faint,
          }}
        />
      </div>
    </>
  );
};

// ------------------------------------------------------------ 左栏
const ASSETS = [
  { id: 'night', name: '城市夜景', scene: 'night' },
  { id: 'ramen', name: '热气拉面', scene: 'ramen' },
  { id: 'cat', name: '猫咪治愈', scene: 'cat' },
  { id: 'stage', name: '小鲸舞台', scene: 'stage' },
];

const EFFECTS: Array<{ id: string; name: string; icon: React.ReactNode; tone: string }> = [
  {
    id: 'fade', name: '淡入', tone: C.greenSoft,
    icon: <><circle cx={0} cy={0} r={9} fill="none" stroke={INK} strokeWidth={2.4} /><circle cx={0} cy={0} r={4} fill={INK} /></>,
  },
  {
    id: 'flip', name: '翻转', tone: C.greenSoft,
    icon: <path d="M -10 -6 L -2 -6 L -2 6 L -10 6 Z M 2 -6 L 10 -6 L 10 6 L 2 6 Z" fill={INK} />,
  },
  {
    id: 'zoom', name: '推近', tone: C.pink,
    icon: <><circle cx={-2} cy={-2} r={8} fill="none" stroke={INK} strokeWidth={2.4} /><path d="M 4 4 L 11 11" stroke={INK} strokeWidth={2.8} strokeLinecap="round" /></>,
  },
  {
    id: 'glitch', name: '故障', tone: C.pink,
    icon: <path d="M -11 -5 q 5 -5 10 0 t 10 0 M -11 2 q 5 -5 10 0 t 10 0 M -11 9 q 5 -5 10 0 t 10 0" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />,
  },
  {
    id: 'paper', name: '纸片', tone: C.lilac,
    icon: <path d="M -9 -8 L 4 -8 L 10 -1 L 10 8 L -9 8 Z" fill="none" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />,
  },
  {
    id: 'bounce', name: '弹跳', tone: C.lilac,
    icon: <><path d="M 0 8 L 0 -8 M -6 -2 L 0 -9 L 6 -2" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /><path d="M -8 11 L 8 11" stroke={INK} strokeWidth={2.6} strokeLinecap="round" /></>,
  },
];

const TEXTS = [
  { id: 'power', label: '前方高能', bg: C.yellow, fg: '#3A3222' },
  { id: 'nice', label: '好耶～', bg: C.pink, fg: '#5A3A44' },
  { id: 'neon', label: '复古 NEON', bg: C.purple, fg: '#F3E9FF' },
];

const TABS: Array<{ id: LeftTab; label: string }> = [
  { id: 'asset', label: '素材' },
  { id: 'effect', label: '特效' },
  { id: 'text', label: '文字' },
];

export const LeftPanel: React.FC<{
  tab: LeftTab;
  effectHot: string | null;
  textHot: string | null;
  dragGhost: { scene: string; x: number; y: number; k: number } | null;
}> = ({ tab, effectHot, textHot, dragGhost }) => (
  <>
    <div
      style={box({
        left: L.left.x, top: L.left.y, width: L.left.w, height: L.left.h,
        background: C.panel, borderRadius: 18, border: `2px solid ${C.panelEdge}`,
      })}
    >
      {/* 页签 */}
      {TABS.map((tb, i) => {
        const on = tb.id === tab;
        return (
          <div
            key={tb.id}
            style={{
              position: 'absolute', left: 18 + i * 108, top: 24, width: 102, height: 52,
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: on ? C.yellow : 'transparent',
              border: on ? `2px solid rgba(63,74,69,0.30)` : `2px solid ${C.faint}`,
              fontSize: 25, fontWeight: 700, color: on ? '#3A3222' : C.muted,
            }}
          >
            {tb.label}
          </div>
        );
      })}

      {/* 素材 */}
      {tab === 'asset' &&
        ASSETS.map((a, i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const x = 18 + col * 170, y = 126 + row * 186;
          const beingDragged = dragGhost && dragGhost.scene === a.scene && dragGhost.k > 0.05;
          return (
            <div key={a.id} style={{ position: 'absolute', left: x, top: y, width: 154 }}>
              <div
                style={{
                  width: 154, height: 116, borderRadius: 12, overflow: 'hidden',
                  border: `2px solid ${C.panelEdge}`, background: '#fff',
                  opacity: beingDragged ? 0.28 : 1,
                }}
              >
                <SceneUse scene={a.scene} w={150} h={112} poster />
              </div>
              <div style={{ marginTop: 8, textAlign: 'center', fontSize: 21, ...label, color: C.inkSoft }}>
                {a.name}
              </div>
            </div>
          );
        })}

      {/* 特效 */}
      {tab === 'effect' &&
        EFFECTS.map((e, i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const x = 18 + col * 170, y = 126 + row * 104;
          const hot = effectHot === e.id;
          return (
            <div
              key={e.id}
              style={{
                position: 'absolute', left: x, top: y, width: 154, height: 84,
                borderRadius: 12, background: hot ? C.greenMid : e.tone,
                border: `2px solid ${hot ? C.green : 'rgba(63,74,69,0.22)'}`,
                display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 18,
                boxSizing: 'border-box',
                transform: hot ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <svg width={30} height={30} viewBox="-16 -16 32 32">{e.icon}</svg>
              <span style={{ fontSize: 24, fontWeight: 700, color: hot ? '#243A28' : C.ink }}>{e.name}</span>
            </div>
          );
        })}

      {/* 文字 */}
      {tab === 'text' && (
        <>
          {TEXTS.map((tx, i) => {
            const hot = textHot === tx.id;
            return (
              <div
                key={tx.id}
                style={{
                  position: 'absolute', left: 18, top: 126 + i * 96, width: 324, height: 78,
                  borderRadius: 14, background: tx.bg,
                  border: `2px solid rgba(63,74,69,0.34)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 29, fontWeight: 800, color: tx.fg, letterSpacing: 2,
                  transform: hot ? 'translateX(6px) scale(1.03)' : 'none',
                  boxShadow: hot ? '0 5px 0 rgba(63,74,69,0.18)' : 'none',
                }}
              >
                {tx.label}
              </div>
            );
          })}
          <div
            style={{
              position: 'absolute', left: 18, top: 424, width: 324, textAlign: 'center',
              fontSize: 21, color: C.muted,
            }}
          >
            拖到画面，马上开演
          </div>
        </>
      )}
    </div>

    {/* 拖动中的素材幽灵 */}
    {dragGhost && dragGhost.k > 0.02 && (
      <div
        style={box({
          left: dragGhost.x - 46, top: dragGhost.y - 36, width: 92, height: 72,
          borderRadius: 10, overflow: 'hidden', opacity: dragGhost.k,
          border: `3px solid ${C.green}`, transform: 'rotate(-6deg)',
          boxShadow: '0 8px 0 rgba(63,74,69,0.16)',
        })}
      >
        <SceneUse scene={dragGhost.scene} w={86} h={66} poster />
      </div>
    )}
  </>
);

// ------------------------------------------------------------ 右栏
// cy 为面板内相对坐标；饱和度轨道落在绝对 y=421，与手部接触点一致
const ROWS = [
  { id: 'brightness', name: '亮度', cy: 141, fmt: (v: number) => `${Math.round(v)}%` },
  { id: 'saturation', name: '饱和度', cy: 241, fmt: (v: number) => `${Math.round(v)}%` },
  { id: 'grain', name: '颗粒感', cy: 341, fmt: (v: number) => `${Math.round(v)}%` },
  { id: 'speed', name: '速度', cy: 441, fmt: (v: number) => `${v.toFixed(1)}×` },
];
const T0 = 1412, T1 = 1740;
const MAXV: Record<string, number> = { brightness: 100, saturation: 200, grain: 100, speed: 2 };

export const RightPanel: React.FC<{
  sliders: { brightness: number; saturation: number; grain: number; speed: number };
  autoBeat: boolean;
}> = ({ sliders, autoBeat }) => (
  <div
    style={box({
      left: L.right.x, top: L.right.y, width: L.right.w, height: L.right.h,
      background: C.panel, borderRadius: 18, border: `2px solid ${C.panelEdge}`,
    })}
  >
    <div style={{ position: 'absolute', left: 32, top: 30, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: 2 }}>调整</span>
      <svg width={22} height={22} viewBox="-11 -11 22 22">
        <path d="M 0 -9 L 2.4 -2.4 L 9 0 L 2.4 2.4 L 0 9 L -2.4 2.4 L -9 0 L -2.4 -2.4 Z" fill={C.green} />
      </svg>
    </div>

    {ROWS.map((r) => {
      const v = (sliders as never as Record<string, number>)[r.id];
      const u = clamp(v / MAXV[r.id]);
      return (
        <div key={r.id}>
          <div
            style={{
              position: 'absolute', left: 32, top: r.cy - 46, width: 366,
              display: 'flex', justifyContent: 'space-between', fontSize: 24, color: C.ink,
            }}
          >
            <span style={{ fontWeight: 600 }}>{r.name}</span>
            <span style={{ fontWeight: 700, color: C.inkSoft }}>{r.fmt(v)}</span>
          </div>
          <div
            style={{
              position: 'absolute', left: T0 - L.right.x, top: r.cy - 3,
              width: T1 - T0, height: 6, borderRadius: 3, background: C.faint,
            }}
          />
          <div
            style={{
              position: 'absolute', left: T0 - L.right.x, top: r.cy - 3,
              width: (T1 - T0) * u, height: 6, borderRadius: 3, background: C.green,
            }}
          />
          <div
            style={{
              position: 'absolute', left: T0 - L.right.x + (T1 - T0) * u - 13, top: r.cy - 13,
              width: 26, height: 26, borderRadius: 13, background: '#FFFDF6',
              border: `3px solid ${C.green}`,
            }}
          />
        </div>
      );
    })}

    <div
      style={{
        position: 'absolute', left: 32, top: 510, width: 366, height: 68,
        borderRadius: 22, background: autoBeat ? C.greenMid : C.greenSoft,
        border: `2px solid rgba(63,74,69,0.24)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        fontSize: 26, fontWeight: 700, color: autoBeat ? '#22392A' : '#4E6B55',
      }}
    >
      <span style={{ fontSize: 22 }}>♪</span>
      {autoBeat ? '节拍已对齐' : '自动卡点'}
    </div>
  </div>
);

// ------------------------------------------------------------ 垃圾桶
export const Trash: React.FC<{ x: number; y: number; k: number; lid: number }> = ({ x, y, k, lid }) => {
  if (k <= 0.01) return null;
  return (
    <svg
      width={130} height={150}
      viewBox="0 0 130 150"
      style={{ position: 'absolute', left: x - 65, top: y - 96, opacity: k }}
    >
      <g transform={`rotate(${lid * -34},34,32)`}>
        <path d="M 6 30 L 62 30 L 58 44 L 10 44 Z" fill="#B7C2B8" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
        <path d="M 26 22 L 42 22 L 45 30 L 23 30 Z" fill="#B7C2B8" stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
      </g>
      <path d="M 10 46 L 58 46 L 52 138 L 16 138 Z" fill="#C6D0C6" stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${24 + i * 10} 58 L ${22 + i * 10} 126`} stroke={INK} strokeWidth={2.6} opacity={0.35} strokeLinecap="round" />
      ))}
      {/* 被丢进去的片段 */}
      <g transform={`translate(${34},${72}) rotate(-12)`} opacity={0.9}>
        <rect x={-26} y={-9} width={52} height={18} rx={4} fill={C.ramenBg2} stroke={INK} strokeWidth={2.2} />
        <rect x={-20} y={-4} width={40} height={4} rx={2} fill={C.soup} opacity={0.7} />
      </g>
    </svg>
  );
};

// ------------------------------------------------------------ 气泡
export const Bubble: React.FC<{ x: number; y: number; k: number; text: string }> = ({ x, y, k, text }) => {
  if (k <= 0.01) return null;
  return (
    <div
      style={box({
        left: x, top: y,
        transform: `translate(-50%,-100%) scale(${0.82 + k * 0.18})`,
        transformOrigin: '50% 100%',
        opacity: k,
        background: C.bubble, border: `2.5px solid ${INK}`, borderRadius: 16,
        padding: '10px 18px', fontSize: 24, fontWeight: 700, color: C.ink,
        whiteSpace: 'nowrap', boxShadow: '0 5px 0 rgba(63,74,69,0.14)',
      })}
    >
      {text}
      <div
        style={{
          position: 'absolute', left: '50%', bottom: -11, marginLeft: -8,
          width: 0, height: 0, borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent', borderTop: `11px solid ${INK}`,
        }}
      />
    </div>
  );
};

// ------------------------------------------------------------ 撤销快捷键提示
export const UndoKey: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => {
  if (k <= 0.01) return null;
  return (
    <div
      style={box({
        left: x, top: y, transform: `translate(-50%,-50%) scale(${0.9 + k * 0.1})`,
        opacity: k, background: '#FFFDF6', border: `2.5px solid ${INK}`,
        borderRadius: 10, padding: '6px 14px', fontSize: 22, fontWeight: 700,
        color: C.ink, whiteSpace: 'nowrap', boxShadow: '0 4px 0 rgba(63,74,69,0.15)',
      })}
    >
      Ctrl + Z
    </div>
  );
};
