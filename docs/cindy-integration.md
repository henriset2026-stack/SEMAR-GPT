# Integrasi Cindy ke SEMAR-GPT

Dokumen ini menjelaskan bagaimana fitur, fungsi, dan skill dari proyek
[Cindy](https://github.com/makecindy/cindy) dipetakan ke SEMAR-GPT (LibreChat).
Integrasi ini bersifat **adaptasi**, bukan salinan mentah: instruksi yang hanya
berlaku di host Cindy diganti dengan mekanisme LibreChat yang benar-benar ada di
deployment ini.

## Ringkasan

| Dari Cindy | Di SEMAR-GPT | Status |
| --- | --- | --- |
| 10 bot package (30 skill) | 10 Agent Plugin di `plugin/` | Dimuat saat API start |
| 3 system skill | 3 deployment skill di `skill/` | Dimuat saat API start |
| SkillHub / `cindy_helper` | Skills catalog + API `/api/skills` | Aktif |
| Plugin `.cindy` / `ghost.json` | Agent Plugins (`plugin.json`) | Aktif (eksperimental) |
| Scheduled tasks | Schedules (`interface.schedules`) | Aktif |
| Memory | Memories (`interface.memories`) | Aktif |
| Projects / tasks | Chat Projects | Aktif (default) |
| Artifacts | Artifacts (capability agent) | Tersedia |
| Subagent / background task | Subagents + background tasks | Tersedia |
| Web search | Web Search | Perlu API key provider pencarian |
| File search / RAG | File Search | Nonaktif sampai embedding dikonfigurasi |
| Code execution | Code Interpreter | Perlu `LIBRECHAT_CODE_API_KEY` |
| Browser, Notion, Slack, GitHub, GitLab, X, image generation | MCP server / tool yang dikonfigurasi | Opsional, tidak dibundel |
| Art / OpenDesign / X Manager | Tidak ada padanan langsung | Gunakan tool yang tersedia atau bahan dari user |

## Struktur direktori

```text
skill/                          # deployment skills, read-only, global
  learn/
    SKILL.md
  plugin-creator/
    SKILL.md
    templates/
  skill-creator/
    SKILL.md
    references/contract.md
    license.txt
plugin/                         # Agent Plugins, satu folder per bot package
  ad-spend-watch/
    plugin.json
    README.md
    skills/
      ad-spend-watch-getting-started/SKILL.md
      ad-spend-watch-ops/SKILL.md
      ad-spend-watch-ops/references/method.md
      ad-spend-watch-evidence/SKILL.md
      ad-spend-watch-evidence/scripts/spend_ledger.py
      ad-spend-watch-evidence/templates/
  ...                           # 9 plugin lainnya
scripts/
  check-skills.mjs              # validator tanpa dependensi
  import-cindy.mjs              # importer reproducible
CINDY-LICENSE.txt               # lisensi Apache-2.0 material Cindy
```

`skill/` dan `plugin/` di-mount read-only ke `/app/skill` dan `/app/plugin`
oleh `docker-compose.override.yml`. Keduanya dibaca **saat API start**; setelah
mengubah isinya, restart API:

```bash
docker compose restart api
```

## 10 Agent Plugin

Setiap bot package Cindy menjadi satu Agent Plugin dengan tiga skill:
`getting-started` (sesi pertama), `ops` (prosedur kerja), dan `evidence`
(pemeriksaan offline). Nama skill, script, dan template dipertahankan.

| Plugin | Fokus | Skill |
| --- | --- | --- |
| `ad-spend-watch` | Memantau belanja iklan dari laporan user, ambang batas milik user, saran pacing anggaran | `ad-spend-watch-getting-started`, `-ops`, `-evidence` |
| `apple-search-ads-review` | Reviu data Apple Search Ads terhadap target CPI, daftar perubahan untuk diterapkan user | `apple-search-ads-review-*` |
| `cooper` | Riset topik publik, alert ambang batas, brief berbasis bukti | `cooper-*` |
| `engineer-bot` | Alur kerja engineering dari scope sampai delivery yang bisa direviu | `engineer-bot-*` |
| `nightly-audit-engineer` | Audit kualitas kode dalam scope, bukti dan klue deduplikasi | `nightly-audit-engineer-*` |
| `proto-bot` | Prototipe UI, perubahan, dan bukti reviu dengan struktur aplikasi yang ada | `proto-bot-*` |
| `sable-game-art` | Arah seni game: style guide, palet hex, spesifikasi sprite/tile, prompt gambar | `sable-game-art-*` |
| `seo-aeo-desk` | Papan topik, brief penulis, laporan pencarian, rencana refresh halaman | `seo-aeo-desk-*` |
| `startup-qa-bot` | QA produk di lingkungan uji terisolasi, peta halaman dan checklist regresi | `startup-qa-bot-*` |
| `video-editor` | Rencana edit dan pemeriksaan delivery video vertikal | `video-editor-*` |

Semua plugin hanya berisi skill; tidak ada MCP server yang dibundel. Log startup
menunjukkan `0 MCP server(s)`. Tool eksternal (GitHub, GitLab, browser, email,
 spreadsheet, image generation) harus dikonfigurasi terpisah sebagai MCP server
atau tool bawaan.

## 3 deployment skill

| Skill | Fungsi |
| --- | --- |
| `skill-creator` | Membuat, mereviu, dan memvalidasi `SKILL.md` untuk user, deployment, atau plugin. Termasuk kontrak frontmatter dan batas loader. |
| `learn` | Mengubah alur kerja yang berhasil menjadi draft skill yang direviu sebelum disimpan. Dipicu `/learn`. |
| `plugin-creator` | Membuat Agent Plugin: `plugin.json`, skill bundle, `mcp.json`, dan hook opsional. |

Ketiganya adalah adaptasi dari system skill Cindy. Konsep yang tidak ada di
LibreChat — `cindy_helper`, `start_skill_learning`, SkillHub, `ghost_forge`,
`ghost.json`, paket `.cindy`, `teammate-guide`, dan Forge — dihapus atau diganti
dengan mekanisme yang benar-benar tersedia.

## Cara memakai

### Melihat dan memakai skill

1. Buka **Skills** di sidebar. Semua skill deployment dan plugin muncul di
   katalog.
2. Skill dapat dipanggil eksplisit dari composer, atau dipilih otomatis oleh
   model berdasarkan `description`.
3. Untuk memakai satu bot package sebagai partner, pilih Agent yang memakai
   skill tersebut, atau panggil skill `*-getting-started` pada percakapan baru.
4. Skill `*-evidence` menjalankan pemeriksaan offline. Jika environment dapat
   menjalankan Python, script di `scripts/` dapat dieksekusi dari stdin. Jika
   tidak, ikuti `templates/contract.md` secara manual dan catat bahwa script
   tidak dijalankan.

### Scheduled tasks

`interface.schedules` diaktifkan di `librechat.yaml`, dan
`SCHEDULES_SINGLE_PROCESS=true` di `.env` karena stack hanya menjalankan satu
proses API. Buat jadwal dari panel **Schedules**. Jadwal memakai model dan tool
yang dikonfigurasi; jangan mengandalkan loop latar belakang di dalam skill.

### Memories

`interface.memories: true`. Partner hanya boleh menyimpan preferensi yang
dikonfirmasi user. Data memori dapat dilihat dan dihapus user dari Settings.

### Chat Projects

Chat Projects aktif secara default. Gunakan untuk mengelompokkan percakapan,
instruksi, dan file referensi per pekerjaan atau klien.

## Batasan yang disengaja

- **Tidak ada koneksi akun iklan.** `ad-spend-watch` dan
  `apple-search-ads-review` hanya membaca data yang diberikan user dan memberi
  saran; tidak menjeda campaign atau mengubah budget.
- **Tidak ada publikasi otomatis.** `seo-aeo-desk` tidak menulis artikel final
  atau mem-publish; `video-editor` tidak meng-upload video.
- **Tidak ada tool yang dikarang.** Jika skill menyebut tool yang tidak ada,
  agent harus mengatakan demikian dan meminta bahan atau memakai tool lain.
- **Script tidak dijalankan otomatis.** Loader hanya membaca `SKILL.md` dan
  file pendukung. Eksekusi script terjadi saat agent menjalankannya, dengan
  izin tool yang berlaku.
- **Bahasa body skill tetap Mandarin.** Ini mempertahankan isi asli Cindy;
  deskripsi frontmatter diterjemahkan ke Inggris agar katalog terbaca. Agent
  diminta menjawab dalam bahasa user.
- **Agent Plugins masih eksperimental.** Jika loader menolak sebuah plugin,
  lihat log `[agentPlugins]` dan jalankan validator.
- **Hook plugin tidak aktif secara default.** Hook hanya berjalan bila operator
  mengatur `DEPLOYMENT_PLUGIN_HOOKS`.

## Validasi

Validator tidak membutuhkan dependensi dan mencerminkan aturan loader:

```bash
node scripts/check-skills.mjs
```

Di dalam container:

```bash
docker exec semar-gpt-api node /app/scripts/check-skills.mjs --root /app
```

Yang diperiksa: frontmatter, nama dan deskripsi, batas ukuran body, tipe
boolean, duplikasi nama lintas deployment/plugin, manifest plugin, bentuk
`mcp.json`, symlink, path traversal, dan file yang direferensikan tetapi tidak
ada.

Setelah restart, cek log:

```bash
docker logs semar-gpt-api 2>&1 | grep -E "agentPlugins|deploymentSkills|schedules"
```

Contoh hasil yang benar:

```text
[agentPlugins] Loaded 10 plugin(s) from /app/plugin: 30 skill(s), 0 MCP server(s)
[deploymentSkills] Loaded 33 deployment skill(s) from /app/skill
[schedules] engine started
```

## Memperbarui dari Cindy

Importer bersifat satu arah dan tidak dijalankan otomatis. Untuk menyegarkan
dari checkout Cindy:

```bash
node scripts/import-cindy.mjs --source /path/to/cindy-main --force
node scripts/check-skills.mjs
docker compose restart api
```

Perubahan manual pada `plugin/` akan tertimpa oleh `--force`. Lakukan perubahan
SEMAR-GPT lewat `scripts/import-cindy.mjs` (daftar `REPLACEMENTS` dan
`*_DESCRIPTIONS`) agar dapat direproduksi, atau edit langsung dan jangan
jalankan ulang importer tanpa menggabungkan perubahan tersebut.

## Provenance dan lisensi

Material Cindy berasal dari `apps/desktop/resources/bot-packages` dan
`apps/desktop/resources/system-skills` pada repositori
`https://github.com/makecindy/cindy`, dilisensikan Apache-2.0. Salinan lisensi
ada di [`CINDY-LICENSE.txt`](../CINDY-LICENSE.txt). Setiap `plugin.json`
mencantumkan `license: Apache-2.0` dan repositori sumber. Kode LibreChat dan
branding SEMAR-GPT tetap mengikuti lisensi masing-masing; lihat
[`LICENSE`](../LICENSE).
