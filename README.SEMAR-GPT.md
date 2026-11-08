# SEMAR-GPT

<p align="center">
  <img src="client/public/assets/logo.svg" width="120" alt="SEMAR-GPT logo" />
</p>

**SEMAR-GPT** adalah aplikasi asisten AI yang dibangun di atas
[LibreChat](https://github.com/LibreChat-AI/LibreChat). Repo ini adalah
deployment yang sudah di-branding: nama aplikasi, logo, favicon, tema warna,
welcome screen, dan footer sudah disesuaikan untuk SEMAR-GPT.

- **Antarmuka:** React + Vite, tema navy/teal dengan aksen emas.
- **Backend:** Node.js/TypeScript, MongoDB, Meilisearch, dan RAG API.
- **Model:** semua provider yang didukung LibreChat (OpenAI, Anthropic, Google,
  Azure, Bedrock, Ollama, vLLM, LiteLLM, gateway OpenAI-compatible, dan lain-lain).
- **Lisensi:** MIT, mengikuti lisensi LibreChat.

---

## Mulai cepat (Docker)

Prasyarat: Docker Desktop (atau Docker Engine + Compose plugin) sudah berjalan.

```bash
# dari root repo
./scripts/semar.sh start
```

Atau langsung:

```bash
docker compose up -d --build
```

Build pertama memakan waktu beberapa menit karena image aplikasi dibangun dari
repo ini (agar logo dan branding SEMAR-GPT ikut masuk). Setelah itu, buka
**http://localhost:3080**.

1. Daftar akun pertama. Akun pertama otomatis menjadi admin.
2. Buka **Settings → Providers** (atau menu model) dan isi API key provider,
   atau konfigurasikan gateway internal di `librechat.yaml` (lihat di bawah).
3. Mulai percakapan.

Perintah lain:

```bash
./scripts/semar.sh status    # status service
./scripts/semar.sh logs      # ikuti log API
./scripts/semar.sh restart   # restart stack
./scripts/semar.sh stop      # stop, data tetap tersimpan
./scripts/semar.sh reset     # stop + hapus volume data (destruktif)
```

> Stack Docker memakai project name `semar-gpt` dan container
> `semar-gpt-api`, `semar-gpt-mongodb`, dan seterusnya. Data tersimpan di
> volume Compose dan folder `./data-node`, `./meili_data_v1.35.1`, `./uploads`,
> `./logs`, dan `./images`.
>
> Panel admin di port **3000** adalah tool upstream LibreChat dan belum
> di-rebranding. Jika tidak diperlukan, hapus service `admin-panel` dari
> stack.

---

## Menghubungkan model AI

### Opsi 1 — Provider bawaan (paling cepat)

Isi kunci di `.env`, lalu restart API:

```dotenv
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_KEY=...
# DEEPSEEK_API_KEY=...
```

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, dan `GOOGLE_KEY` di `.env` saat ini
bernilai `user_provided`. Nilai itu berarti endpoint aktif dan setiap pengguna
bisa memasukkan API key-nya sendiri lewat **Settings → Providers** (BYOK).
Ganti dengan kunci milik deployment jika ingin semua pengguna memakai kunci
yang sama.

### Opsi 2 — Gateway OpenAI-compatible internal

Cocok untuk vLLM, Ollama, LiteLLM, OpenRouter, atau gateway perusahaan.
Tambahkan ke `.env`:

```dotenv
SEMAR_API_BASE_URL=https://gateway.internal/v1
SEMAR_API_KEY=...
```

Lalu buka `librechat.yaml`, hapus komentar pada blok `endpoints.custom`, dan
sesuaikan `models.default` dengan nama model di gateway:

```yaml
endpoints:
  custom:
    - name: 'SEMAR'
      apiKey: '${SEMAR_API_KEY}'
      baseURL: '${SEMAR_API_BASE_URL}'
      models:
        default: ['semar-1']
        fetch: false
      titleConvo: true
      titleModel: 'semar-1'
      modelDisplayLabel: 'SEMAR-GPT'
```

Restart setelah mengubah konfigurasi:

```bash
./scripts/semar.sh restart
```

### Opsi 3 — Preset SEMAR-GPT di welcome screen

`librechat.yaml` juga menyertakan contoh `modelSpecs` yang sudah dikomentari.
Aktifkan blok itu untuk menampilkan preset **SEMAR-GPT** dengan instruksi
sistem berbahasa Indonesia di pemilih model.

---

## Kustomisasi branding

| Yang diubah | File |
| --- | --- |
| Nama aplikasi, footer, URL bantuan | `.env` (`APP_TITLE`, `CUSTOM_FOOTER`, `HELP_AND_FAQ_URL`) |
| Welcome screen, tema, fitur chat | `librechat.yaml` |
| Judul tab, meta tag, PWA title | `client/index.html` |
| Nama/ikon PWA | `client/vite.config.ts` |
| Logo halaman login | `client/public/assets/logo.svg` |
| Favicon & ikon PWA | `client/public/assets/favicon-*.png`, `apple-touch-icon-180x180.png`, `icon-192x192.png`, `maskable-icon.png` |
| Fallback judul dokumen | `client/src/utils/documentTitle.ts` |
| Nama container & mount config | `docker-compose.override.yml` |

### Mengganti logo

Ganti `client/public/assets/logo.svg` dengan SVG baru (disarankan kanvas
persegi, latar transparan atau rounded square). Untuk favicon, ganti PNG di
folder yang sama dengan ukuran yang sesuai. Jika membangun ulang image,
jalankan:

```bash
docker compose build api
docker compose up -d
```

Jika memakai image resmi LibreChat (bukan build lokal), file frontend di
dalam image tidak ikut berubah. Build image sendiri dari repo ini, atau mount
aset statis sesuai kebutuhan deployment.

### Mengubah teks sambutan

Edit `interface.customWelcome` di `librechat.yaml`. Teks ini dirender sebagai
teks biasa (bukan Markdown) dan mendukung placeholder `{{user.name}}` jika
diinginkan.

### Tema warna

Tema `semar-gpt` didefinisikan inline di `librechat.yaml`. Hanya token yang
berbeda dari default LibreChat yang ditulis; sisanya mewarisi tema bawaan.
Token warna memakai triplet RGB dengan format `"R G B"`.

---

## Development lokal

Prasyarat: Node.js **24.x** (lihat `.nvmrc`), npm, dan MongoDB.

Cara termudah: jalankan infrastruktur lewat Docker, lalu jalankan aplikasi di
host.

```bash
# 1. Infrastruktur (MongoDB + Meilisearch, hanya bind ke 127.0.0.1)
docker compose up -d mongodb meilisearch

# 2. Dependensi
npm install

# 3. Terminal A — backend (http://localhost:3080)
npm run backend:dev

# 4. Terminal B — frontend Vite (http://localhost:3090)
npm run frontend:dev
```

Catatan:

- Backend membaca `.env` dan `librechat.yaml` dari root repo.
- `SEARCH=true` membutuhkan Meilisearch. Jika tidak menjalankan Meilisearch,
  set `SEARCH=false` di `.env`.
- Frontend dev server berjalan di port 3090 dan mem-proxy API ke 3080.
- Untuk membuat user dari CLI: `npm run create-user`.

---

## Konfigurasi penting

### `.env`

`.env` dibuat dari `.env.example` dan sudah berisi:

- `APP_TITLE=SEMAR-GPT`
- `CUSTOM_FOOTER="SEMAR-GPT — Asisten AI Anda | Didukung oleh [LibreChat](https://librechat.ai)"`
- `SEARCH=true` dan `MEILI_MASTER_KEY` acak
- `CREDS_KEY`, `CREDS_IV`, `JWT_SECRET`, `JWT_REFRESH_SECRET` acak
- `ADMIN_PANEL_SESSION_SECRET` acak
- `ALLOW_REGISTRATION=true`, `ALLOW_EMAIL_LOGIN=true`
- `SCHEDULES_SINGLE_PROCESS=true` (deployment satu container; mengaktifkan scheduled tasks)

> **Penting untuk produksi:** ganti semua secret acak di atas, gunakan HTTPS,
> set `DOMAIN_CLIENT`/`DOMAIN_SERVER` ke domain publik, dan pertimbangkan
> menonaktifkan registrasi publik (`ALLOW_REGISTRATION=false`) setelah akun
> dibuat. Jangan commit `.env`.

### `librechat.yaml`

Berisi branding, tema, fitur chat, dan contoh endpoint/preset. File ini
di-mount ke container oleh `docker-compose.override.yml`.

### File yang di-ignore Git

Upstream LibreChat meng-ignore `.env*`, `librechat.yaml`, dan
`docker-compose.override.yml`. Jika ingin menyimpan konfigurasi SEMAR-GPT di
repo, tambahkan pengecualian di `.gitignore` atau gunakan `git add -f` dengan
hati-hati (jangan pernah commit secret).

---

## Troubleshooting

**Port 3080 sudah dipakai**

Ubah `PORT` di `.env` dan `DOMAIN_CLIENT`/`DOMAIN_SERVER`, lalu restart.

**Container API restart terus**

Lihat log: `./scripts/semar.sh logs`. Penyebab umum: secret kosong, MongoDB
belum siap, atau `librechat.yaml` tidak valid. Validasi YAML dengan
`python3 -c "import yaml; yaml.safe_load(open('librechat.yaml'))"`.

**Tidak ada model di pemilih model**

Belum ada provider yang dikonfigurasi. Isi API key di `.env` atau aktifkan
endpoint custom di `librechat.yaml`, lalu restart.

**File search tidak muncul**

Sengaja dinonaktifkan (`interface.fileSearch: false`) karena RAG API
membutuhkan embedding provider. Set `RAG_OPENAI_API_KEY` (atau backend
embedding lain), ubah `fileSearch: true`, lalu restart.

**Izin file di Linux**

Jika container tidak bisa menulis `./uploads`, sesuaikan `UID`/`GID` di `.env`
dengan `id -u` dan `id -g`, lalu restart.

---

## Struktur repo

```
.
├── api/                         # wiring Express (upstream LibreChat)
├── client/                      # React app + branding assets
│   ├── public/assets/           # logo, favicon, ikon PWA
│   ├── src/                     # komponen, hook, locale
│   ├── index.html               # judul & meta SEMAR-GPT
│   └── vite.config.ts           # manifest PWA
├── packages/                    # backend, data-provider, shared UI
├── librechat.yaml               # branding, tema, endpoint
├── .env                         # secret & konfigurasi lokal (jangan di-commit)
├── docker-compose.yml           # stack upstream
├── docker-compose.override.yml  # project name, container name, mount config
├── scripts/semar.sh             # helper start/stop/logs
└── README.SEMAR-GPT.md          # dokumen ini
```

---

## Atribusi

SEMAR-GPT dibangun di atas LibreChat, proyek open source MIT. Logo dan nama
SEMAR-GPT adalah branding deployment ini; kode dasar tetap milik para
kontributor LibreChat. Lihat [LICENSE](LICENSE) dan
[README.md](README.md) untuk dokumentasi upstream.
