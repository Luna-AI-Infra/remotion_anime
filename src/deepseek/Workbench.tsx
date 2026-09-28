// 主合成：把外壳、三栏、手机、时间轴、角色按同一时间轴装配起来。
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, L, DURATION } from './theme';
import * as T from './timeline';
import { SceneDefs } from './phone/scenes';
import { Phone, Playback } from './phone/Phone';
import { Card, CardHeader, Headline, LeftPanel, RightPanel, Subtitle, Trash, Bubble, UndoKey } from './panels/Panels';
import { Timeline } from './panels/Timeline';
import { Whale } from './char/Whale';

const DRAGS = [
  { a: 0.32, b: 1.35, scene: 'night' },
  { a: 1.78, b: 2.15, scene: 'ramen' },
  { a: 2.58, b: 2.95, scene: 'cat' },
  { a: 3.38, b: 3.75, scene: 'stage' },
];

const MadeWithCard: React.FC<{ k: number }> = ({ k }) => {
  if (k <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute', left: 300, top: 420, width: 430, height: 268,
        transform: `translateY(${(1 - k) * 40}px) rotate(${-4 + (1 - k) * -4}deg) scale(${0.94 + k * 0.06})`,
        opacity: k, background: '#FFFDF6', border: `3px solid ${C.outline}`,
        borderRadius: 10, boxShadow: '0 10px 0 rgba(63,74,69,0.16)',
        padding: '26px 30px', boxSizing: 'border-box', fontFamily: FONT,
      }}
    >
      <div
        style={{
          position: 'absolute', left: 26, top: -22, width: 78, height: 30,
          background: C.yellow, border: `3px solid ${C.outline}`, borderRadius: 6,
        }}
      />
      <div style={{ fontSize: 25, color: '#6B6455', marginTop: 10 }}>想法，变成动画。</div>
      <div style={{ fontSize: 52, fontWeight: 900, color: '#2F3A35', marginTop: 10, lineHeight: 1.05 }}>
        Made with
      </div>
      <div style={{ fontSize: 52, fontWeight: 900, color: '#2F3A35', lineHeight: 1.05 }}>
        DeepSeek
      </div>
      <div style={{ marginTop: 12, height: 5, width: 190, background: C.coral, borderRadius: 3 }} />
    </div>
  );
};

export const Workbench: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const section = T.sectionAt(t);
  const x = T.charX(t);
  const jump = T.jumpAt(t);
  const crouch = T.crouchAt(t);
  // 常态呼吸：让角色全程有细微起伏，避免死帧
  const idle = Math.sin((t * 2 * Math.PI) / 1.75) * 0.75 + Math.sin((t * 2 * Math.PI) / 0.9) * 0.25;
  const squash = (1 - crouch * 0.16) * (1 + idle * 0.016);
  const bodyTilt = T.tiltAt(t);
  const facing = T.facing(t);
  const expr = T.exprAt(t);
  const blink = T.blinkAt(t);
  const wink = T.winkAt(t);
  const finLag = T.tailLag(t) + Math.sin((t * 2 * Math.PI) / 2.6) * 0.32;

  const hA = T.handA(t);
  const hB = T.handB(t);
  const handA = hA.x === null ? null : { x: hA.x, y: hA.y as number };
  const handB = hB.x === null ? null : { x: hB.x, y: hB.y as number };

  // 目光看向正在操作的目标
  const focusPt = handA ?? handB;
  const gaze = focusPt
    ? { x: Math.max(-1, Math.min(1, (focusPt.x - x) / 320)), y: Math.max(-1, Math.min(1, (focusPt.y - 700) / 320)) }
    : { x: facing * 0.45, y: 0.1 };

  const headTilt =
    (expr === 'think' ? -7 : expr === 'surprise' ? -4 : 0) +
    (expr === 'satisfied' ? 6 : 0) +
    bodyTilt * -0.4 +
    (jump > 0 ? -6 : 0) +
    idle * 2.0;

  const phone = T.phoneAt(t);
  const sliders = T.slidersAt(t);
  const segs = T.clipsAt(t);
  const textClip = T.textClipAt(t);
  const scrap = T.cutScrapAt(t);
  const beats = T.beatMarksAt(t);
  const playhead = T.playheadAt(t);
  const trash = T.trashAt(t);
  const exp = T.exportAt(t);
  const autoBeat = T.autoBeatOn(t);
  const leftTab = T.leftTabAt(t);
  const effectHot = T.effectHotAt(t);
  const textHot = T.textHotAt(t);
  const bubbles = T.bubbleAt(t);
  const madeWith = T.madeWithAt(t);

  const headlineIn = T.span(t, section.a - 0.02, section.a + 0.28, T.easeOut);

  const dragGhost = (() => {
    for (const d of DRAGS) {
      const k = Math.min(T.span(t, d.a, d.a + 0.10), 1 - T.span(t, d.b - 0.10, d.b));
      if (k > 0.02 && handA) return { scene: d.scene, x: handA.x, y: handA.y, k };
    }
    return null;
  })();

  const popIn = T.span(t, 0.12, 0.42, T.easeBackOut);
  const undoKey = T.win(t, 12.80, 13.24, 0.10);

  return (
    <AbsoluteFill style={{ background: C.paper, fontFamily: FONT, overflow: 'hidden' }}>
      {/* 纸底与稳定纸纹（固定 seed，不逐帧变化） */}
      <Img src={staticFile('textures/deepseek-paper.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <SceneDefs />

      <Headline text={section.title} appear={headlineIn} />
      <Subtitle />

      <Card />
      <CardHeader timecode={T.timecodeAt(t)} exportState={exp} />
      <LeftPanel tab={leftTab} effectHot={effectHot} textHot={textHot} dragGhost={dragGhost} />
      <RightPanel sliders={sliders} autoBeat={autoBeat} />
      <Phone t={t} {...phone} saturation={sliders.saturation} grain={sliders.grain} />
      <Playback y={802} active={t > 3.9} />
      {/* 剪辑台上的地面线 */}
      <div
        style={{
          position: 'absolute', left: 76, right: 76, top: L.groundY - 1,
          height: 2, background: C.faint,
        }}
      />

      <Trash x={1344} y={716} k={trash.show} lid={trash.lid} />

      <Timeline
        segs={segs}
        textClip={textClip}
        scrap={scrap}
        beats={beats}
        playhead={playhead}
        autoBeat={autoBeat}
      />

      {/* 角色：画在最上层 */}
      <div
        style={{
          position: 'absolute', inset: 0,
          transform: `translateY(${-jump}px)`,
        }}
      >
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(${x},${L.groundY}) scale(${0.6 + popIn * 0.4}) translate(${-x},${-L.groundY})`}>
            <Whale
              x={x}
              y={L.groundY}
              h={L.charH}
              expr={expr}
              blink={blink}
              wink={wink}
              gaze={gaze}
              headTilt={headTilt}
              bodyTilt={bodyTilt}
              squash={squash}
              handA={handA}
              handB={handB}
              finLag={finLag}
              facing={facing}
              idle={idle}
            />
          </g>
        </svg>
      </div>

      {/* 拖动素材时手臂弧线上的小圆点提示 */}
      {handA && dragGhost && (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[0.25, 0.5, 0.75].map((u) => (
            <circle
              key={u}
              cx={x + (handA.x - x) * u}
              cy={L.groundY - 58 + (handA.y - (L.groundY - 58)) * u}
              r={4}
              fill="#FFFDF6"
              stroke={C.green}
              strokeWidth={2}
              opacity={dragGhost.k * 0.75}
            />
          ))}
        </svg>
      )}

      <UndoKey x={x} y={L.groundY - 210} k={undoKey} />
      {bubbles.map((b, i) => (
        <Bubble key={i} x={b.x} y={b.y} k={b.k} text={b.text} />
      ))}
      <MadeWithCard k={madeWith} />

      
    </AbsoluteFill>
  );
};

export { DURATION };
