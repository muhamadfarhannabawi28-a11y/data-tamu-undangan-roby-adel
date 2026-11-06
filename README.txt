ROBY & ADEL — WEBSITE DATA TAMU UNDANGAN

FILE:
index.html (halaman publik), login.html, admin.html,
css/style.css, js/config.js, js/public.js, js/login.js, js/admin.js,
supabase-setup.sql.

PENTING TENTANG PRIVASI:
Sesuai permintaan, publik dapat melihat NAMA, ALAMAT, NOMINAL, dan
JUMLAH BERAS. Informasi ini dapat dilihat siapa pun dan diakses melalui
Supabase API. Pastikan Roby, Adel, dan para tamu menyetujui publikasi.
Jika tidak, jangan gunakan policy SELECT publik; ubah agar hanya admin
dapat membaca data.

1. SUPABASE
- Buat project Supabase.
- Authentication > Users > Add user > Create new user. Buat satu admin.
- Salin User UID akun admin.
- SQL Editor: buka supabase-setup.sql, ganti semua ADMIN_UID_DI_SINI
  dengan UID tadi, lalu jalankan.
- Project Settings > API/Data API: salin Project URL dan Publishable key
  (atau anon/public key).

2. CONFIG
Buka js/config.js:
- Ganti https://PROJECT-REF.supabase.co dengan Project URL.
- Ganti PASTE_PUBLISHABLE_OR_ANON_KEY_HERE dengan Publishable/anon key.
- Ganti PASTE_ADMIN_USER_UID_HERE dengan UID admin yang sama.
Jangan pernah menaruh service_role/secret key di frontend atau GitHub.

3. LOKAL
Buka folder di VS Code, jalankan Live Server.
Halaman publik: index.html
Login admin: login.html
Dashboard: admin.html

4. VERCEL
- Upload/push isi folder ini ke root repository GitHub; index.html harus ada
  di root folder deployment.
- Login Vercel dengan GitHub > Add New > Project > Import repository.
- Framework Preset: Other.
- Build Command: kosong.
- Output Directory: . (titik).
- Root Directory: ./ jika index.html berada di root repository.
- Klik Deploy. Tes URL vercel.app, /login.html, dan /admin.html.
- Push perubahan GitHub untuk deployment otomatis.

5. AKSES
Hanya UID admin pada config.js dan SQL policy yang boleh INSERT/UPDATE/DELETE.
RLS tetap aktif. Akun lain tidak bisa mengelola data meski dapat login.
Beras disimpan dalam liter (satu angka desimal) dan boleh kosong.
Nominal disimpan sebagai angka rupiah tanpa simbol.
