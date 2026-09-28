// 底部时间轴：刻度尺 / 文字轨 / 视频缩略图轨 / 音频波形 / 播放头 / 节拍标记
import React from 'react';
import { C, L, FONT, TL_SCALE, tlX } from '../theme';
import { SceneUse } from '../phone/scenes';
import type { ClipSeg } from '../timeline';
import { clamp } from '../timeline';

const INK = C.outline;
const ROW = L.tl.clipRow.h;
const THUMB_W = ROW * (300 / 564);

/** 与配乐段落同步的波形包络（确定性） */
const WAVE = (() => {
  const n = 340;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 16.4;
    let e = 0.42;
    if (t < 4) e = 0.5;
    else if (t < 7) e = 0.62;
    else if (t < 10.5) e = 0.66;
    else if (t < 14.5) e = 0.52;
    else if (t < 16.4) e = 0.72;
    if (t > 5.9 && t < 6.4) e *= 0.5;
    if (t > 26.5 - 10.1 && t < 16.4) e = 0.72;
    const s = Math.sin(i * 12.9898) * 43758.5453;
    const r = s - Math.floor(s);
    const s2 = Math.sin(i * 4.1414) * 12345.678;
    const r2 = s2 - Math.floor(s2);
    out.push(clamp(e * (0.35 + 0.65 * r) * (0.7 + 0.3 * r2)));
  }
  return out;
})();

const TrackIcon: React.FC<{ y: number; kind: 'T' | 'V' | 'A' }> = ({ y, kind }) => {
  if (kind === 'T') {
    return (
      <svg width={30} height={30} viewBox="0 0 30 30" style={{ position: 'absolute', left: L.tl.iconX - 15, top: y }}>
        <rect x={1.5} y={1.5} width={27} height={27} rx={6} fill={C.yellow} stroke="rgba(63,74,69,0.3)" strokeWidth={2} />
        <text x={15} y={21} textAnchor="middle" fontSize={17} fontWeight={800} fill={C.ink} fontFamily={FONT}>T</text>
      </svg>
    );
  }
  if (kind === 'V') {
    return (
      <svg width={30} height={30} viewBox="0 0 30 30" style={{ position: 'absolute', left: L.tl.iconX - 15, top: y }}>
        <circle cx={15} cy={15} r={14} fill={C.greenMid} />
        <path d="M 12 9 L 22 15 L 12 21 Z" fill="#25402C" />
      </svg>
    );
  }
  return (
    <svg width={30} height={30} viewBox="0 0 30 30" style={{ position: 'absolute', left: L.tl.iconX - 15, top: y }}>
      <circle cx={15} cy={15} r={14} fill={C.timelinePurple} />
      <path d="M 16 7 L 10 16 L 14 16 L 13 23 L 20 13 L 15.5 13 Z" fill="#3A2E58" />
    </svg>
  );
};

const ClipBlock: React.FC<{ seg: ClipSeg }> = ({ seg }) => {
  const x = tlX(seg.start);
  const w = seg.dur * TL_SCALE;
  if (w <= 0.5) return null;
  const n = Math.max(1, Math.ceil(w / THUMB_W));
  const tw = w / n;
  const scale = 0.42 + 0.58 * clamp(seg.visible);
  return (
    <div
      style={{
        position: 'absolute', left: x, top: L.tl.clipRow.y, width: w, height: ROW,
        boxSizing: 'border-box', borderRadius: 1, overflow: 'hidden',
        border: `2px solid rgba(63,74,69,0.35)`,
        opacity: clamp(seg.visible),
        transform: `translateY(${(1 - clamp(seg.visible)) * -22}px) scaleY(${scale})`,
        transformOrigin: '50% 0%',
        boxShadow: '0 3px 0 rgba(63,74,69,0.10)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={{ width: tw, height: ROW, overflow: 'hidden', flex: '0 0 auto' }}>
            <SceneUse scene={seg.id} w={tw + 1} h={ROW} />
          </div>
        ))}
      </div>
      {seg.showLabel && (
        <div
          style={{
            position: 'absolute', left: 6, top: 5, height: 22, padding: '0 9px',
            borderRadius: 7, background: 'rgba(255,253,246,0.86)',
            display: 'flex', alignItems: 'center',
            fontSize: 16, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap',
          }}
        >
          {seg.label}
        </div>
      )}
      {seg.highlight > 0.01 && (
        <div
          style={{
            position: 'absolute', inset: 0,
            border: `4px solid ${C.green}`,
            background: `rgba(92,138,99,${0.16 * seg.highlight})`,
          }}
        />
      )}
    </div>
  );
};

export const Timeline: React.FC<{
  segs: ClipSeg[];
  textClip: { appear: number; alpha: number; y: number } | null;
  scrap: { a: number; len: number; sel: number; fly: number } | null;
  beats: Array<{ t: number; u: number }>;
  playhead: number;
  autoBeat: boolean;
}> = ({ segs, textClip, scrap, beats, playhead, autoBeat }) => {
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= 64; i++) {
    const sec = i * 0.25;
    const x = tlX(sec);
    const major = i % 8 === 0;
    const mid = i % 4 === 0;
    ticks.push(
      <rect
        key={i} x={x - (major ? 1.3 : 0.8)} y={30}
        width={major ? 2.6 : 1.6} height={major ? 13 : mid ? 8 : 4}
        fill={C.muted} opacity={major ? 0.9 : 0.5}
      />
    );
  }
  const labels: React.ReactNode[] = [];
  for (let s = 0; s <= 16; s += 2) {
    labels.push(
      <text
        key={s} x={tlX(s)} y={18} textAnchor="middle"
        fontSize={18} fill={C.inkSoft} fontFamily={FONT} fontWeight={600}
      >
        {`0:${String(s).padStart(2, '0')}`}
      </text>
    );
  }

  const waveX = tlX(0);
  const waveW = tlX(16.4) - waveX;

  return (
    <>
      {/* 剪刀 */}
      <svg width={34} height={34} viewBox="0 0 34 34" style={{ position: 'absolute', left: 22, top: L.tl.rulerTop + 18 }}>
        <path d="M 12 10 L 27 26 M 22 10 L 7 26" stroke={C.inkSoft} strokeWidth={2.8} strokeLinecap="round" />
        <circle cx={9} cy={28} r={4.2} fill="none" stroke={C.inkSoft} strokeWidth={2.4} />
        <circle cx={25} cy={28} r={4.2} fill="none" stroke={C.inkSoft} strokeWidth={2.4} />
      </svg>

      <svg
        width={1920}
        height={52}
        viewBox="0 0 1920 52"
        style={{ position: 'absolute', left: 0, top: L.tl.rulerTop, overflow: 'visible' }}
      >
        <line x1={22} y1={30} x2={1900} y2={30} stroke={C.line} strokeWidth={1.8} />
        {ticks}
        {labels}
      </svg>

      <TrackIcon y={L.tl.textRow.y - 1} kind="T" />
      <TrackIcon y={L.tl.clipRow.y + 17} kind="V" />
      <TrackIcon y={L.tl.waveRow.y + 6} kind="A" />

      {/* 文字轨 */}
      {textClip && (
        <div
          style={{
            position: 'absolute', left: tlX(segs.find(c=>c.id==='cat')!.start), top: L.tl.textRow.y + textClip.y,
            width: segs.find(c=>c.id==='cat')!.dur * TL_SCALE, height: L.tl.textRow.h,
            borderRadius: 8, background: C.yellow,
            border: `2px solid rgba(63,74,69,0.32)`,
            display: 'flex', alignItems: 'center', paddingLeft: 10, gap: 8,
            fontSize: 17, fontWeight: 700, color: '#3A3222',
            opacity: clamp(textClip.alpha) * clamp(textClip.appear),
            transform: `scale(${0.85 + clamp(textClip.appear) * 0.15})`,
            transformOrigin: '0% 50%', whiteSpace: 'nowrap', overflow: 'hidden',
          }}
        >
          <span
            style={{
              width: 20, height: 20, borderRadius: 5, background: '#FFFDF6',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800,
            }}
          >
            T
          </span>
          前方高能预警
        </div>
      )}

      {/* 视频轨 */}
      {segs.map((s) => (
        <ClipBlock key={s.key} seg={s} />
      ))}

      {/* 被剪掉的片段：选中框 + 斜纹 */}
      {scrap && (
        <div
          style={{
            position: 'absolute', left: tlX(scrap.a), top: L.tl.clipRow.y,
            width: scrap.len * TL_SCALE, height: ROW, borderRadius: 10,
            border: `4px dashed ${C.playhead}`,
            background:
              'repeating-linear-gradient(45deg, rgba(226,112,58,0.35) 0 7px, rgba(226,112,58,0.10) 7px 14px)',
            opacity: scrap.sel,
          }}
        />
      )}

      {/* 音频波形 */}
      <div
        style={{
          position: 'absolute', left: waveX, top: L.tl.waveRow.y,
          width: waveW, height: L.tl.waveRow.h, borderRadius: 12,
          background: C.timelinePurple, border: `2px solid rgba(63,74,69,0.28)`,
          overflow: 'hidden',
        }}
      >
        <svg width={waveW} height={L.tl.waveRow.h} viewBox={`0 0 ${waveW} ${L.tl.waveRow.h}`}>
          {WAVE.map((v, i) => {
            const x = (i / WAVE.length) * waveW + 2;
            const h = 3 + v * (L.tl.waveRow.h - 12);
            return (
              <rect
                key={i} x={x} y={(L.tl.waveRow.h - h) / 2} width={2.6} height={h} rx={1.3}
                fill="#FFFFFF" opacity={0.62}
              />
            );
          })}
        </svg>
      </div>

      {/* 节拍标记 */}
      <svg
        width={1920} height={30} viewBox="0 0 1920 30"
        style={{ position: 'absolute', left: 0, top: L.tl.beatRow.y, overflow: 'visible' }}
      >
        {beats.map((b, i) => (
          <g key={i} opacity={clamp(b.u)}>
            <path
              d={`M ${tlX(b.t) - 6} 2 L ${tlX(b.t) + 6} 2 L ${tlX(b.t)} 12 Z`}
              fill={C.green}
            />
            <text
              x={tlX(b.t)} y={26} textAnchor="middle" fontSize={13}
              fill={C.green} fontFamily={FONT} fontWeight={700}
            >
              ♪
            </text>
          </g>
        ))}
      </svg>

      {/* 播放头 */}
      <div
        style={{
          position: 'absolute', left: tlX(playhead) - 1.5,
          top: L.tl.rulerTop + 24, width: 3,
          height: L.tl.waveRow.y + L.tl.waveRow.h - (L.tl.rulerTop + 24),
          background: C.playhead, opacity: 0.92,
        }}
      />
      <svg
        width={30} height={40} viewBox="0 0 30 40"
        style={{ position: 'absolute', left: tlX(playhead) - 15, top: L.tl.rulerTop + 6 }}
      >
        <path d="M 15 38 L 3 14 Q 1 6 9 6 L 21 6 Q 29 6 27 14 Z" fill={C.playhead} />
        <rect x={11} y={11} width={8} height={5} rx={2} fill="#FFF3EA" opacity={0.8} />
      </svg>

      {/* 自动卡点打开时的轨道高亮 */}
      {autoBeat && (
        <div
          style={{
            position: 'absolute', left: waveX, top: L.tl.waveRow.y,
            width: waveW, height: L.tl.waveRow.h, borderRadius: 12,
            border: `3px solid ${C.green}`, pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};
