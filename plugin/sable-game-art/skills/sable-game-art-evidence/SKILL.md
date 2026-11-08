---
name: sable-game-art-evidence
description: "Audit supplied PNGs (base64) for off-palette colors, semi-transparent fringes, canvas size, grid divisibility, and empty frames, and compute a slicing plan; audit and plan only, without modifying images or using the network."
metadata:
  source: cindy
  package: sable-game-art
  package-version: 0.5.2
  short-description: "Game art direction"
---
> Adapted from Cindy for SEMAR-GPT. Use only tools that exist in the current environment, never claim a tool ran when it did not, and reply in the user's current language.


# 原创离线辅助检查

核对用户提供的 PNG（base64）：调色板外颜色、半透明杂边、画布尺寸、网格整除与空帧，并算出切分方案；只审计和计划，不修改图片、不联网。

输入输出示例见 templates/input.json 与 templates/contract.md。用户要求对已提供数据做离线处理时，先检查脚本；如果当前环境可以运行 Python，再从 stdin 传 JSON：

    python3 scripts/sprite_audit.py < selected-input.json

脚本只用Python 3.10+标准库，不访问网络/Home，不写文件，不执行子进程。安装、打包和技能加载都不会执行它。如果当前环境不能运行 Python，按 templates/contract.md 手工核对，并在结果中注明脚本未执行。成功exit0，输入结构/引用错误exit2；语义缺口在输出字段中保持可见。输入≤1MiB，最多10000条；所有示例都是合成数据。输出不是凭证、授权、测试或真实连接证明。
