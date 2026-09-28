# 素材清单

| 素材 | 路径 | 来源 / 如何复现 | 使用位置 |
|---|---|---|---|
| GPT 终端机器人 | `src/codex/GptWorkbench.tsx` | 选定 C 设计后用 SVG 绘制 | 主角、实体手臂、表情 |
| DeepSeek 小鲸 | `src/deepseek/char/Whale.tsx` | DeepSeek 初版，Codex 后续完善 | 主角、实体手臂、表情 |
| 手机内容与编辑界面 | `src/codex/`、`src/deepseek/phone/`、`panels/` | 程序 SVG，不需要外部视频 | 夜景、拉面、猫、舞台、工作台 |
| A/B/C 风格稿 | `docs/images/A-*.png` 等 | AI 图像生成；完整原提示词在 `docs/prompts/design-prompts.json` | 设计说明，不是渲染依赖 |
| 棉纸纹理 | `public/textures/codex-paper.png` | 自制固定 seed 程序纸纹；`scripts/generate_codex_texture.py` | Codex 背景 |
| 小鲸纸纹 | `public/textures/deepseek-paper.png` | `scripts/generate_deepseek_textures.py` | DeepSeek 背景 |
| Codex 音乐与音效 | `public/audio/codex.wav` | `scripts/generate_codex_music.py`，原始程序合成 | 48kHz、立体声、120BPM |
| DeepSeek 音乐与音效 | `public/audio/deepseek.wav` | `scripts/generate_deepseek_music.py`，原始程序合成 | 44.1kHz、立体声、120BPM |
| 本仓库渲染图 | `docs/images/codex-*.png`、`deepseek-*.png` | `npm run stills` | README 实际预览 |
| 中文字体 | npm 包 `@fontsource/noto-sans-sc` | Noto Sans SC，OFL-1.1 | 两版统一字体 |

全部文件校验值见 [asset-manifest.json](asset-manifest.json)。

最终 SVG、音频和纹理已随仓库提供，可直接渲染。
