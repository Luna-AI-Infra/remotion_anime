import React from 'react';
import {AbsoluteFill, Audio, Composition, staticFile} from 'remotion';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import {GptWorkbenchV4} from './codex/GptWorkbench';
import {Workbench} from './deepseek/Workbench';
const Codex=()=> <AbsoluteFill><GptWorkbenchV4/><Audio src={staticFile('audio/codex.wav')}/></AbsoluteFill>;
const DeepSeek=()=> <AbsoluteFill><Workbench/><Audio src={staticFile('audio/deepseek.wav')}/></AbsoluteFill>;
export const Root=()=> <><Composition id="CodexWorkbench" component={Codex} width={1920} height={1080} fps={30} durationInFrames={918}/><Composition id="DeepSeekWorkbench" component={DeepSeek} width={1920} height={1080} fps={30} durationInFrames={918}/></>;
