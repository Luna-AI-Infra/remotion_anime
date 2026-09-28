// 手机预览：深灰绿机身 + 内部素材 + 真实生效的饱和度/故障/翻转效果。
import React from 'react';
import { C, L } from '../theme';
import { SceneUse, SW, SH } from './scenes';
import { Whale } from '../char/Whale';
import type { PhoneState } from '../timeline';
import { clamp } from '../timeline';

const INK = C.outline;

const CONFETTI = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin(i * 91.7 + n * 47.3) * 21943.13;
    return v - Math.floor(v);
  };
  return {
    x: 8 + r(1) * (SW - 16),
    d: r(2),
    s: 5 + r(3) * 8,
    rot: r(4) * 360,
    col: ['#EBD79B', '#F0C8D0', '#CDC3E4', '#9CC6A6', '#F2D98C'][i % 5],
    sway: 10 + r(5) * 26,
  };
});

const DanceWhale: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  const beat = (t * 2) % 1;
  const bob = Math.abs(Math.sin(Math.PI * beat)) * 11 * k;
  const sway = Math.sin(Math.PI * 2 * beat) * 7 * k;
  const armUp = Math.sin(Math.PI * 2 * beat);
  return (
    <g transform={`translate(0,${-bob}) rotate(${sway * 0.35},150,470)`}>
      <Whale
        x={150}
        y={470}
        h={128}
        expr={k > 0.2 ? 'proud' : 'happy'}
        blink={0}
        wink={0}
        gaze={{ x: 0, y: -0.4 }}
        headTilt={sway * 1.1}
        bodyTilt={sway * 0.5}
        squash={1 + bob / 260}
        handA={{ x: 150 - 56 - armUp * 20, y: 380 + armUp * 30 }}
        handB={{ x: 150 + 56 + armUp * 20, y: 380 - armUp * 30 }}
        finLag={-sway / 8}
        facing={1}
      />
    </g>
  );
};

export interface PhoneProps extends PhoneState {
  t: number;
  saturation: number;
  grain: number;
}

export const Phone: React.FC<PhoneProps> = (p) => {
  const { t, scene, prevScene, sceneIn, cutPiece, goodPart, title, flip, glitch, dance, confetti, done, finished } = p;
  const sat = clamp(p.saturation / 100, 0, 2.6);

  const screenFlip = Math.abs(flip) > 0.001;

  return (
    <div
      style={{
        position: 'absolute',
        left: L.phone.cx - L.phone.w / 2,
        top: L.phone.top,
        width: L.phone.w,
        height: L.phone.h,
      }}
    >
      {/* 侧键 */}
      <div style={{ position: 'absolute', left: -4, top: 148, width: 5, height: 46, borderRadius: 3, background: '#2C332F' }} />
      <div style={{ position: 'absolute', left: -4, top: 208, width: 5, height: 46, borderRadius: 3, background: '#2C332F' }} />
      <div style={{ position: 'absolute', right: -4, top: 178, width: 5, height: 62, borderRadius: 3, background: '#2C332F' }} />

      {/* 机身 */}
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: 50, background: '#3A403C',
          border: `3px solid #2A302C`, boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 11, borderRadius: 41, background: '#EDE3D0',
        }}
      />

      {/* 屏幕 */}
      <div
        style={{
          position: 'absolute', inset: 16, borderRadius: 37, overflow: 'hidden',
          background: '#101828',
          transform: screenFlip ? `perspective(900px) rotateY(${flip * 62}deg)` : undefined,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 素材本体（饱和度滤镜真实作用于它）。切素材时旧画面留在下层做交叉溶解 */}
        {p.prevScene !== 'empty' && sceneIn < 1 && (
          <div style={{ position: 'absolute', inset: 0, filter: `saturate(${sat})` }}>
            <SceneUse scene={p.prevScene} w={L.phone.w - 32} h={L.phone.h - 32} />
          </div>
        )}
        {scene !== 'empty' && (
          <div
            style={{
              position: 'absolute', inset: 0,
              opacity: sceneIn,
              filter: `saturate(${sat})`,
            }}
          >
            <SceneUse time={p.localTime} scene={scene} w={L.phone.w - 32} h={L.phone.h - 32} />
          </div>
        )}

        {/* 舞台场景里会跳舞的小鲸 */}
        {scene === 'stage' && (
          <svg
            viewBox={`0 0 ${SW} ${SH}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            preserveAspectRatio="xMidYMid slice"
          >
            <DanceWhale t={p.localTime+.12} k={dance} />
          </svg>
        )}

        {/* 好耶～表情层：素材本身的细节叠加 */}
        {scene === 'ramen' && cutPiece > 0.01 && (
          <div
            style={{
              position: 'absolute', left: 0, right: 0, top: '34%',
              textAlign: 'center', transform: 'translateY(-50%)',
              opacity: cutPiece,
            }}
          >
            <div
              style={{
                fontSize: 38, fontWeight: 800, color: '#3B2A22', letterSpacing: 2,
                textShadow: '0 2px 0 rgba(255,255,255,0.55)',
              }}
            >
              多余片段…
            </div>
            <div style={{ marginTop: 10, fontSize: 17, color: '#6A5548', opacity: 0.8 }}>
              这段用不上
            </div>
          </div>
        )}
        {scene === 'ramen' && goodPart > 0.01 && (
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 46, textAlign: 'center',
              opacity: goodPart, transform: `scale(${0.9 + goodPart * 0.1})`,
            }}
          >
            <div
              style={{
                display: 'inline-block', padding: '7px 20px', borderRadius: 20,
                background: 'rgba(255,249,233,0.92)', fontSize: 21, fontWeight: 700, color: '#4A3A2A',
              }}
            >
              今天，嗦一口！
            </div>
          </div>
        )}

        {/* 文字轨标题 */}
        {title > 0.01 && (
          <div
            style={{
              position: 'absolute', left: 0, right: 0, top: '46%', textAlign: 'center',
              opacity: title, transform: `translateY(-50%) scale(${0.86 + title * 0.14})`,
            }}
          >
            <div
              style={{
                display: 'inline-block', padding: '10px 26px', borderRadius: 16,
                background: C.yellow, border: `2.5px solid ${INK}`,
                fontSize: 30, fontWeight: 800, color: '#3A3222', letterSpacing: 2,
                boxShadow: '0 4px 0 rgba(37,58,82,0.12)',
              }}
            >
              前方高能预警
            </div>
          </div>
        )}

        {/* 故障效果：扫描条 + 错位色带 */}
        {glitch > 0.01 && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {Array.from({ length: 9 }).map((_, i) => {
              const y = ((i * 61 + 20) % 100);
              const on = Math.sin(t * 34 + i * 2.1) > 0;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute', left: 0, right: 0,
                    top: `${y}%`, height: 6 + (i % 3) * 5,
                    background: i % 2 ? 'rgba(226,60,180,0.5)' : 'rgba(80,220,220,0.42)',
                    transform: `translateX(${on ? 14 * glitch : -12 * glitch}px)`,
                    opacity: glitch,
                    mixBlendMode: 'screen',
                  }}
                />
              );
            })}
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(0deg, rgba(200,60,200,0.16) 0 3px, rgba(255,255,255,0) 3px 8px)',
                opacity: glitch,
              }}
            />
            <div
              style={{
                position: 'absolute', left: 0, right: 0, top: '18%', height: '34%',
                background: 'rgba(150,240,190,0.22)', opacity: glitch, mixBlendMode: 'screen',
              }}
            />
          </div>
        )}

        {/* 成片定格：纸屑 + 搞定了 */}
        {confetti > 0.01 && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {CONFETTI.map((c, i) => {
              const u = clamp((t - 26.5) * 0.85 - c.d * 0.8);
              const y = -20 + u * (SH + 60);
              const x = c.x + Math.sin(u * 7 + i) * c.sway;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${(x / SW) * 100}%`,
                    top: `${(y / SH) * 100}%`,
                    width: c.s, height: c.s * 0.62,
                    background: c.col, borderRadius: 1.6,
                    transform: `rotate(${c.rot + u * 320}deg)`,
                    opacity: confetti,
                  }}
                />
              );
            })}
          </div>
        )}
        {done > 0.01 && (
          <div
            style={{
              position: 'absolute', left: 0, right: 0, top: '26%', textAlign: 'center',
              opacity: done, transform: `scale(${0.7 + done * 0.3}) rotate(${(1 - done) * -8}deg)`,
            }}
          >
            <span
              style={{
                fontSize: 54, fontWeight: 900, color: C.yellow,
                WebkitTextStroke: `3px ${INK}`, letterSpacing: 3,
                textShadow: '0 5px 0 rgba(37,58,82,0.28)',
              }}
            >
              搞定了！
            </span>
          </div>
        )}
        {finished > 0.01 && (
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 30, textAlign: 'center',
              opacity: finished * 0.9, fontSize: 16, color: '#FFFFFF', letterSpacing: 4,
            }}
          >
            FINAL · 1080p
          </div>
        )}

        {/* 刘海 */}
        <div
          style={{
            position: 'absolute', left: '50%', top: 8, width: 76, height: 16,
            marginLeft: -38, borderRadius: 9, background: '#2A302C',
          }}
        />
        {/* Home 指示条 */}
        <div
          style={{
            position: 'absolute', left: '50%', bottom: 12, width: 92, height: 6,
            marginLeft: -46, borderRadius: 3, background: 'rgba(255,255,255,0.85)',
          }}
        />
      </div>
    </div>
  );
};

/** 手机下方播放控制：◀ ▶ ▶ */
export const Playback: React.FC<{ y: number; active: boolean }> = ({ y, active }) => (
  <div
    style={{
      position: 'absolute', left: 0, right: 0, top: y - 22, height: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26,
    }}
  >
    <svg width={30} height={22} viewBox="0 0 30 22">
      <path d="M 12 3 L 3 11 L 12 19 Z" fill={INK} opacity={0.85} />
      <rect x={15} y={3} width={3.4} height={16} rx={1.4} fill={INK} opacity={0.85} />
    </svg>
    <svg width={46} height={46} viewBox="0 0 46 46">
      <circle cx={23} cy={23} r={21} fill="#FCF8EF" stroke={INK} strokeWidth={2.6} />
      <path d="M 18 14 L 33 23 L 18 32 Z" fill={active ? C.green : INK} />
    </svg>
    <svg width={30} height={22} viewBox="0 0 30 22">
      <path d="M 18 3 L 27 11 L 18 19 Z" fill={INK} opacity={0.85} />
      <rect x={11.6} y={3} width={3.4} height={16} rx={1.4} fill={INK} opacity={0.85} />
    </svg>
  </div>
);
