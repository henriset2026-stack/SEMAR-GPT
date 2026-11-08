# Agent Plugins

Folder ini berisi 10 Agent Plugin yang diadaptasi dari bot package
[Cindy](https://github.com/makecindy/cindy). Setiap plugin dimuat oleh API saat
startup dan menyumbang tiga skill ke katalog Skills.

| Plugin | Fokus |
| --- | --- |
| [`ad-spend-watch`](ad-spend-watch/) | Memantau belanja iklan dari laporan user dan ambang batas milik user. |
| [`apple-search-ads-review`](apple-search-ads-review/) | Reviu data Apple Search Ads terhadap target CPI. |
| [`cooper`](cooper/) | Riset topik publik, alert ambang batas, brief berbasis bukti. |
| [`engineer-bot`](engineer-bot/) | Alur engineering dari scope sampai delivery yang bisa direviu. |
| [`nightly-audit-engineer`](nightly-audit-engineer/) | Audit kualitas kode dengan bukti dan klue deduplikasi. |
| [`proto-bot`](proto-bot/) | Prototipe UI dan bukti reviu. |
| [`sable-game-art`](sable-game-art/) | Arah seni game: style guide, palet, spesifikasi sprite/tile. |
| [`seo-aeo-desk`](seo-aeo-desk/) | Papan topik, brief penulis, laporan pencarian. |
| [`startup-qa-bot`](startup-qa-bot/) | QA produk di lingkungan uji terisolasi. |
| [`video-editor`](video-editor/) | Rencana edit dan pemeriksaan delivery video vertikal. |

Setiap plugin memiliki `plugin.json`, `README.md`, dan
`skills/<nama>/{getting-started,ops,evidence}/SKILL.md`. Script dan template
asli dipertahankan di folder skill masing-masing.

## Memuat dan memvalidasi

Plugin dibaca dari `/app/plugin` (default `DEPLOYMENT_PLUGINS_DIR`) saat API
start. Folder ini di-mount read-only oleh `docker-compose.override.yml`.
Setelah mengubah isi plugin:

```bash
node scripts/check-skills.mjs
docker compose restart api
docker logs semar-gpt-api 2>&1 | grep agentPlugins
```

Tidak ada MCP server yang dibundel di plugin ini. Untuk menambahkan tool
eksternal, buat `mcp.json` sesuai kontrak Agent Plugins; lihat
[`skill/plugin-creator`](../skill/plugin-creator/SKILL.md).

## Provenance

Sumber: `https://github.com/makecindy/cindy`,
`apps/desktop/resources/bot-packages`. Lisensi Apache-2.0; salinan di
[`CINDY-LICENSE.txt`](../CINDY-LICENSE.txt). Jangan menjalankan ulang
`scripts/import-cindy.mjs --force` tanpa menggabungkan perubahan lokal.
