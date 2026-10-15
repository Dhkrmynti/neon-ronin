# Launch Neon Ronin ke Robinhood Chain (mainnet)

Mainnet = **ETH asli dan permanen**. Supply (888), harga (0.001 ETH), batas (10/wallet, 5/transaksi) dan
provenance hash dikunci di kontrak saat deploy dan **tidak bisa diubah lagi**. Ikuti urutannya.

Perintah lokal di bawah untuk **PowerShell** (Windows), dijalankan dari `D:\BLOKCHAIN\ronin`.
Perintah server dijalankan di VPS lewat SSH.

## 0. Yang perlu disiapkan

- **Domain** untuk website, misalnya `neonronin.xyz`. Gambar dan metadata NFT disajikan dari domain ini.
- **VPS** (bisa VPS yang sama dengan proyek token; skripnya hanya menambah 1 situs nginx).
- **Wallet deployer** khusus proyek ini, berisi sedikit ETH di Robinhood Chain untuk gas
  (deploy ~1,8 juta gas; di L2 biasanya jauh di bawah 1 dolar). Wallet ini jadi **owner** kontrak:
  yang bisa membuka mint, reveal, dan menarik hasil mint. Simpan seed phrase-nya baik-baik.

## 1. Generate drop asli (sekali saja, di komputer sendiri)

Pilih **seed rahasia** yang panjang dan acak. Siapa pun yang tahu seed bisa melihat semua ronin sebelum reveal.

```powershell
npm run generate -- --drop --count 888 --seed "GANTI-DENGAN-SEED-RAHASIA" --site-url https://neonronin.xyz
npm run generate
```

- Baris pertama membuat 888 ronin asli di `vault/` (privat, tidak pernah di-commit / di-upload),
  metadata tersegel di `public/hidden/`, dan `public/provenance.json`.
- Baris kedua membuat ulang set preview untuk website.
- **Backup** seed dan folder `vault/` di tempat aman (misalnya password manager + flashdisk).
  Tanpa itu reveal tidak bisa dilakukan. Seed + `--count 888` yang sama selalu menghasilkan drop yang sama.

## 2. Pasang website di VPS

Commit dan push dulu (folder `vault/` otomatis diabaikan git). Di VPS:

```sh
git clone <repo> /opt/neon-ronin
cd /opt/neon-ronin
DOMAIN=neonronin.xyz sh scripts/install-server.sh
```

Arahkan DNS (`A @` dan `A www` ke IP VPS), tunggu sampai `ping neonronin.xyz` benar, lalu:

```sh
DOMAIN=neonronin.xyz sh scripts/install-server.sh https
```

Cek dari browser: `https://neonronin.xyz/hidden/1.json` harus tampil JSON "Sealed".

## 3. Simpan private key deployer (terenkripsi)

```powershell
cd contracts
npx hardhat keystore set ROBINHOOD_PRIVATE_KEY
```

Hardhat meminta password keystore lalu private key. Key **tidak** disimpan dalam bentuk teks biasa
dan tidak pernah masuk git. Jangan pernah tempel private key ke chat atau file.

## 4. Deploy kontrak

Uji coba dulu (tidak mengirim apa pun, hanya menampilkan ringkasan):

```powershell
$env:RONIN_BASE_URI = "https://neonronin.xyz/hidden/"
npm run deploy:robinhood
```

Periksa **setiap baris**: network (Robinhood Chain, chain 4663), alamat deployer, saldo,
supply 888, harga, royalty, provenance. Kalau semua benar:

```powershell
$env:RONIN_CONFIRM = "yes"
npm run deploy:robinhood
Remove-Item Env:RONIN_CONFIRM
cd ..
```

Alamat kontrak ditulis ke `src/data/deployment.json`. Mint masih **tertutup**.

## 5. Update website dengan alamat kontrak

Commit `src/data/deployment.json`, push, lalu di VPS:

```sh
cd /opt/neon-ronin && git pull && DOMAIN=neonronin.xyz sh scripts/install-server.sh update
```

Website sekarang menampilkan "Mint closed" dan counter 0 / 888.

## 6. Buka mint

```powershell
npm run mint:open
```

Untuk menutup lagi: `$env:RONIN_OPEN = "0"; npm run mint:open`.

## 7. Reveal (setelah sold out, atau kapan pun kamu mau)

```powershell
npm run reveal          # cek vault cocok dengan provenance, salin koleksi asli ke public/collection/
```

Commit + push (`public/collection/` dan `src/data/roster.json`), update VPS seperti langkah 5,
pastikan `https://neonronin.xyz/collection/metadata/1.json` bisa dibuka, lalu:

```powershell
$env:RONIN_BASE_URI = "https://neonronin.xyz/collection/metadata/"
npm run contract:reveal
```

Kalau semua NFT sudah tampil benar di wallet dan marketplace, kunci metadata selamanya:

```powershell
$env:RONIN_FREEZE = "1"; npm run contract:reveal
```

## 8. Tarik hasil mint

```powershell
npm run contract:withdraw
```

Semua ETH di kontrak dikirim ke wallet owner.
