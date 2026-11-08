---
name: apple-search-ads-review-evidence
description: "Aggregate supplied Apple Search Ads search-term data by ad group against the cost-per-install target, merge duplicate terms, and list negative and exact-match candidates; keep gaps unknown, with no network access, estimates, or ad-account changes."
metadata:
  source: cindy
  package: apple-search-ads-review
  package-version: 0.5.2
  short-description: "Apple Search Ads review"
---
> Adapted from Cindy for SEMAR-GPT. Use only tools that exist in the current environment, never claim a tool ran when it did not, and reply in the user's current language.


# 原创离线辅助检查

按广告组汇总用户导出的搜索词数据并对照每次安装成本目标，归并重复词，列出否定词和精确词候选；缺项保持未知，不联网、不估算、不操作广告账户。

输入输出示例见 templates/input.json 与 templates/contract.md。用户要求对已提供数据做离线处理时，先检查脚本；如果当前环境可以运行 Python，再从 stdin 传 JSON：

    python3 scripts/asa_terms.py < selected-input.json

脚本只用Python 3.10+标准库，不访问网络/Home，不写文件，不执行子进程。安装、打包和技能加载都不会执行它。如果当前环境不能运行 Python，按 templates/contract.md 手工核对，并在结果中注明脚本未执行。成功exit0，输入结构/引用错误exit2；语义缺口在输出字段中保持可见。输入≤1MiB，最多10000条；所有示例都是合成数据。输出不是凭证、授权、测试或真实连接证明。
