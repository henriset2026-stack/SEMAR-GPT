# Deployment Skills

Folder ini berisi skill deployment yang dimuat oleh API saat startup. Setiap
skill berada di foldernya sendiri dengan file `SKILL.md`:

```text
skill/
  my-shared-skill/
    SKILL.md
    references/
      notes.md
```

Skill deployment bersifat read-only, tersedia untuk semua user yang memiliki
akses Skills, dan tidak disimpan sebagai dokumen Skill di MongoDB.

## Skill yang tersedia

| Skill | Fungsi |
| --- | --- |
| [`skill-creator`](skill-creator/SKILL.md) | Membuat dan memvalidasi `SKILL.md` untuk user, deployment, atau plugin. |
| [`learn`](learn/SKILL.md) | Mengubah alur kerja yang berhasil menjadi draft skill yang direviu. |
| [`plugin-creator`](plugin-creator/SKILL.md) | Membuat Agent Plugin: `plugin.json`, skill bundle, dan `mcp.json`. |

Skill bot dari Cindy tidak berada di sini; masing-masing dibundel sebagai Agent
Plugin di [`plugin/`](../plugin/). Lihat
[`docs/cindy-integration.md`](../docs/cindy-integration.md) untuk peta lengkap.

## Menambah skill

1. Buat folder `skill/<nama-skill>/` dengan `SKILL.md`.
2. Ikuti kontrak frontmatter: nama kebab-case 1–64 karakter, deskripsi maksimal
   1.024 karakter yang menyebutkan kapan skill dipakai, body maksimal 100.000
   karakter.
3. Tambahkan `references/`, `scripts/`, `templates/`, atau `assets/` hanya bila
   membawa detail yang tidak muat di body. Gunakan path relatif dan jangan
   memakai symlink.
4. Validasi dari root repo:

   ```bash
   node scripts/check-skills.mjs
   ```

5. Restart API agar skill dimuat:

   ```bash
   docker compose restart api
   ```

Nama skill harus unik di seluruh `skill/` dan `plugin/*/skills/`. Jika nama
bertabrakan, loader akan melewati salah satunya.
