# 制作流程与实现入口

## 技术选择

画面本身由 React 组织，SVG 绘制角色、手机内容和编辑面板，Remotion 以帧号计算运动并导出 H.264。内容能拆成矢量图形与确定的操作时序，因此采用这条技术路线。

| 要改什么 | Codex 入口 | DeepSeek 入口 |
|---|---|---|
| 角色、手臂、表情、面板 | `src/codex/GptWorkbench.tsx` | `src/deepseek/char/Whale.tsx`、`panels/` |
| 片段与手机同步 | `src/codex/playback.ts` | `src/deepseek/timeline.ts` |
| 手机里的夜景、面条、猫、舞台 | `GptWorkbench.tsx` | `phone/scenes.tsx` |
| 配色、坐标、接触点 | `GptWorkbench.tsx` 常量 | `theme.ts` |
| 输出尺寸、时长、音频 | `src/Root.tsx` | 同左 |

## 为什么动作能连起来

- 每一帧都由 `frame / fps` 算出来，不依赖上一帧、系统时钟或随机渲染顺序。
- 起手有准备，接触时压缩，放开后回弹；身体先动，手脚和装饰略滞后，各部件分别设置缓动与延迟。
- 手套目标坐标与按钮、滑块共用。身体跳动和缩放时补偿接触坐标，避免手在按住滑块时飘走。
- `clipsAt(t)` 计算片段的累计起点；`playbackAt(t)` 给出播放头位置、命中片段和片段内时间。手机内容和时间轴消费同一状态，删除后不会各走各的。
- 用同一饱和度状态控制滑块和手机滤镜，过调时惊讶，回调时恢复。点击、星星和音效落在接触事件上。
- 夜景水波、灯光，面条热气，猫尾巴和舞台灯都用独立周期；幅度让位给当前操作。

## 迭代路线

1. 原参考拆解、八段操作与角色方案。
2. 选择 C，生成第一份可完整观看的工作台预览。
3. 反馈：光线手改实体长臂；增加节奏 BGM 和动作踩点；滤镜与画面联动；加强角色表情、跳跃及手机内容。
4. 后续工作台完善：片段紧贴、播放头同步、非舞蹈素材增加动态，渲染高清 V4。

## 改成你自己的版本

先改角色轮廓和色板，再改手机中的内容。保持 UI 接触点与手臂目标一致；改变片段长度时同步检查音效事件。若改变总时长，需一起修改 `Root.tsx` 的帧数、状态测试范围和音乐生成参数。

## 音乐如何制作

两条音轨均由 NumPy 合成。Codex 为 120 BPM、48kHz 立体声，鼓、贝斯、和弦、旋律和操作音效分别合成；DeepSeek 为 120 BPM、44.1kHz，含操作提示、扫频和收尾。DeepSeek WAV 有短尾音，视频按 30.6 秒截取。

可选：使用 Python 3.10 或更新版本，在虚拟环境安装 `pip install -r requirements.txt`，运行：

```bash
python scripts/generate_codex_music.py
python scripts/generate_deepseek_music.py
python scripts/generate_deepseek_textures.py
python scripts/generate_codex_texture.py
```

音乐输出覆盖 `public/audio/codex.wav` / `deepseek.wav`，Codex 分轨在 `public/audio/codex-stems/`。生成脚本使用固定 seed；直接渲染时使用仓库内的素材即可。

## 检查

`npm test` 在两个版本各 1836 个时间点检查片段无缝、播放头命中、手机局部时间一致；`npm run typecheck` 检查接口。`npm run stills` 输出代表帧，`npm run render -- all` 输出完整视频。最终还要自己观看一遍并核听，尤其留意手部接触、滤镜反馈、文字遮挡与节拍。
