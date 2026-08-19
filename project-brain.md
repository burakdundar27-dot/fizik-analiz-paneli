# 🧠 PROJECT BRAIN — Fizik Analiz ve Takip Paneli

> Bu dosya projenin **tek doğruluk kaynağıdır** (single source of truth).
> Her yeni oturumda Claude önce bu dosyayı okur, sonra kod yazar.
> Kod ile bu dosya çelişirse **bu dosya kazanır**; kod düzeltilir veya dosya bilinçli olarak güncellenir.

**Sürüm:** 0.5 · **Son güncelleme:** 2026-08-20 · **Durum:** Faz 1 ve Faz 4 tamam — sınıf yapısı `student_teacher` ilişki tablosuyla değiştirildi, Faz 2 (seed/manuel test) hâlâ açık

---

## 1. Projenin Amacı

Ortaöğretim fizik dersinde öğrencinin **yanlış yaptığı soruyu fotoğraflayıp**, o sorunun hangi **alt kazanıma** ait olduğunu ve **neden yanlış yaptığını** işaretlediği; öğretmenin ise bu kayıtları **tarih ve hata nedeni** kırılımında görüp öğrencinin gerçek eksiğini teşhis ettiği bir web paneli.

**Çözdüğü problem:** "Öğrenci fizikten kötü" yerine → "Öğrencinin sorunu *Newton'un 2. yasasında vektörel toplama* değil, *serbest cisim diyagramı çizememe*; ve hata nedeni bilgi eksikliği değil, **işlem hatası**."

### Kullanıcı Rolleri
| Rol | Ne yapar |
|---|---|
| `student` | Soru fotoğrafı yükler, konusunu (alt kazanım) ve kendi hata sebebini (Eksik Bilgi, İşlem Hatası, Dikkat vb.) seçer, kendi geçmişini görür |
| `teacher` | Öğrencilerini isim isim listede görür, bir öğrenciye tıklayınca yalnız o öğrencinin kronolojik soru kaydını ve "En Çok Yanlış Yapılan Konular" tablosunu görür, öğrenciye not düşer |

> ⚠️ **KESİN KURAL — Sınıf yapısı yoktur.** Uygulama sınıf/şube kavramı olmadan tamamen **özel ders odaklı**, öğretmen-öğrenci **isim bazlı** doğrudan ilişkisiyle çalışır. Sınıf oluşturma, `join_code` ile katılma gibi tüm mantık kaldırıldı — bkz. §3.2, §5 Faz 4, Karar #13.

### Kapsam Dışı (kalıcı — MVP sonrasına ertelenen değil, tamamen YOK)
- **AI / OCR tamamen devre dışı.** Otomatik soru çözümü, fotoğraftan soru okuma, OpenAI/Gemini gibi herhangi bir AI entegrasyonu **projede yer almaz** — Karar #14.
- Klasördeki `tyt_*.pdf` kitapçıklarının parse edilip soru havuzuna dönüşmesi
- Sınıf/şube yapısı, `join_code` ile katılma (yukarıya bkz.)
- Mobil uygulama, veli girişi, mesajlaşma, ödeme

---

## 2. Teknik Altyapı

| Katman | Teknoloji | Neden |
|---|---|---|
| Framework | **Next.js 16.3 (App Router, Turbopack)** | Server Components ile Supabase sorguları doğrudan sunucuda, az kod |
| Dil | **TypeScript** (`strict: true`) | Kazanım/hata-nedeni gibi sabit kümeleri tip güvenliğiyle tutmak |
| UI | **React 19 + Tailwind CSS v4** | — |
| Komponent | **shadcn/ui** (Radix tabanlı) | 21st.dev komponentleri shadcn üzerine kurulu; kopyala-yapıştır, node_modules şişmez |
| İkon | **lucide-react** | shadcn ile aynı ekosistem |
| DB | **Supabase (PostgreSQL)** | RLS ile rol bazlı güvenlik veritabanı seviyesinde |
| Auth | **Supabase Auth** (email + şifre) | — |
| Dosya | **Supabase Storage** (`question-images` bucket) | Soru fotoğrafları |
| Form | **react-hook-form + zod** | Tek şemadan hem client hem server validasyonu |
| Grafik | **Recharts** | Faz 5 analiz ekranı |
| Tarih | **date-fns** (`tr` locale) | Türkçe tarih formatı |
| Deploy | **Vercel** | — |

**Kullanılmayacaklar:** Redux/Zustand (URL state + Server Components yeter), ORM/Prisma (Supabase client yeter), ayrı Express backend, CSS-in-JS.

### Klasör Yapısı
```
/
├── project-brain.md            ← bu dosya
├── veri/tyt-pdf/               ← mevcut PDF kitapçıklar (Faz 6 için arşiv)
├── supabase/migrations/        ← SQL migration dosyaları (elle yazılır, sıralı)
├── src/
│   ├── app/
│   │   ├── (auth)/login/ · register/
│   │   ├── (student)/panel/ · panel/yeni/ · panel/gecmis/
│   │   ├── (teacher)/ogretmen/ · ogretmen/analiz/ · ogretmen/ogrenci/[id]/
│   │   ├── layout.tsx · page.tsx · globals.css
│   ├── components/
│   │   ├── ui/                 ← shadcn (elle DÜZENLENMEZ)
│   │   ├── question/           ← QuestionCard, QuestionForm, ImageUploader
│   │   ├── outcome/            ← OutcomeSelect (kademeli seçici)
│   │   └── shared/             ← Header, RoleGuard, EmptyState, StatTile
│   ├── lib/
│   │   ├── supabase/client.ts · server.ts · middleware.ts
│   │   ├── constants.ts        ← ERROR_REASONS, QUESTION_STATUSES, renkler
│   │   ├── validations.ts      ← zod şemaları
│   │   └── utils.ts            ← cn() vb.
│   ├── types/database.ts       ← Supabase'den generate edilir, ELLE YAZILMAZ
│   └── proxy.ts                ← oturum yenileme + giriş kapısı
│                                 (Next 16'da "middleware" → "proxy" adlandırması)
└── .env.local                  ← ASLA commit edilmez
```

---

## 3. Veritabanı Şeması

**İlke:** Kazanım hiyerarşisi 4 kademe — `Ünite → Konu → Kazanım → Alt Kazanım`. Öğrenci **alt kazanım** seçer (en ince kırılım); analiz yukarı doğru toplanır.

```
units (ünite)
  └── topics (konu)
        └── outcomes (kazanım)
              └── sub_outcomes (alt kazanım)  ←── questions buraya bağlanır
```

### 3.1 `profiles`
`auth.users` ile 1-1. Trigger ile otomatik oluşur.

| Kolon | Tip | Not |
|---|---|---|
| `id` | `uuid` PK | → `auth.users.id` ON DELETE CASCADE |
| `full_name` | `text` NOT NULL | |
| `role` | `user_role` NOT NULL | `'student'` \| `'teacher'`, default `'student'` |
| `grade_level` | `smallint` | 9–12, öğrenci için |
| `created_at` | `timestamptz` | default `now()` |

### 3.2 `student_teacher` — öğretmen-öğrenci ilişkisi
`classes` / `class_members` tabloları **yoktur** (kalıcı olarak kaldırıldı, Karar #13). Yerine öğretmen-öğrenci bağını tutan ayrı bir ilişki tablosu var — `profiles.teacher_id` gibi tek kolonlu bir çözüm **değil**, bilinçli olarak ayrı tablo (Karar #15).

| Kolon | Tip | Not |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `teacher_id` | `uuid` NOT NULL | → profiles CASCADE |
| `student_id` | `uuid` NOT NULL | → profiles CASCADE |
| `created_at` | `timestamptz` | default `now()` |

**UNIQUE(teacher_id, student_id)** — aynı bağ iki kez eklenmez.

**Bağlama akışı:** Öğretmen panelinde öğrencinin e-postasını girer → `public.link_student_by_email(p_email)` (security definer RPC, `join_class_by_code`'un yerini alan desen) `auth.users`'ta e-postayı arar, `profiles.role = 'student'` olduğunu doğrular, `student_teacher` satırını ekler. Öğrenci tarafında herhangi bir kod/katılma adımı yoktur — bağlama tamamen öğretmen tarafından yapılır.

### 3.3 Kazanım Hiyerarşisi (referans tabloları — salt okunur)
Hepsinde ortak: `id` uuid PK, `code` text UNIQUE, `title` text NOT NULL, `order_no` smallint, `created_at`.

| Tablo | Ek kolonlar | Örnek kayıt |
|---|---|---|
| `units` | `grade_level` smallint NOT NULL | `9.3` — "Kuvvet ve Hareket" |
| `topics` | `unit_id` → units CASCADE | `9.3.1` — "Hareket" |
| `outcomes` | `topic_id` → topics CASCADE | `9.3.1.1` — "Konum, yer değiştirme ve yol kavramlarını açıklar" |
| `sub_outcomes` | `outcome_id` → outcomes CASCADE | `9.3.1.1.a` — "Skaler ve vektörel büyüklükleri ayırt eder" |

> `code` alanı MEB kazanım numarasını izler → hem insan okunur hem seed idempotent (`ON CONFLICT (code) DO NOTHING`).

### 3.4 `questions` — ⭐ Ana tablo
| Kolon | Tip | Not |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `student_id` | `uuid` NOT NULL | → profiles CASCADE |
| `sub_outcome_id` | `uuid` NOT NULL | → sub_outcomes RESTRICT |
| `image_path` | `text` NOT NULL | Storage yolu: `{student_id}/{uuid}.webp` — **tam URL değil** |
| `error_reason` | `error_reason` NOT NULL | enum, aşağıda |
| `status` | `question_status` NOT NULL | enum, default `'review_needed'` |
| `source` | `text` | "TYT 2024", "Ders kitabı s.112", serbest metin |
| `student_note` | `text` | Öğrencinin kendi yorumu |
| `teacher_note` | `text` | Öğretmen geri bildirimi (sadece teacher yazar) |
| `is_resolved` | `boolean` | default `false` — öğrenci "artık anladım" der |
| `solved_at` | `timestamptz` | `is_resolved` true olunca set edilir |
| `created_at` / `updated_at` | `timestamptz` | `updated_at` trigger ile |

### 3.5 Enum'lar
```sql
create type user_role as enum ('student', 'teacher');

create type error_reason as enum (
  'knowledge_gap',      -- Bilgi eksikliği: kazanımı hiç bilmiyor
  'misconception',      -- Kavram yanılgısı: yanlış biliyor (fizikte kritik!)
  'calculation_error',  -- İşlem/matematik hatası
  'misread_question',   -- Soru kökünü yanlış okuma
  'diagram_error',      -- Şekil/grafik/serbest cisim diyagramı hatası
  'unit_error',         -- Birim ve büyüklük hatası
  'careless',           -- Dikkatsizlik
  'time_pressure'       -- Süre yetmedi
);

create type question_status as enum (
  'wrong',              -- Yanlış yaptı
  'blank',              -- Boş bıraktı
  'lucky_guess',        -- Doğru ama emin değildi
  'review_needed'       -- Tekrar edilecek
);
```
> ⚠️ Enum değerleri **kodda İngilizce**, arayüzde Türkçe. Eşleme `src/lib/constants.ts` içinde tek yerde tutulur. Yeni değer eklemek migration gerektirir — enum'a değer eklemek kolay, **çıkarmak zordur**; kararlı tut.

### 3.6 İndeksler
```sql
create index on questions (student_id, created_at desc);
create index on questions (sub_outcome_id);
create index on questions (error_reason);
create index on student_teacher (teacher_id);
create index on student_teacher (student_id);
```

### 3.7 RLS Politikaları (kritik)
**Tüm tablolarda RLS AÇIK.** Yetki kontrolü uygulamada değil **veritabanında** yapılır.

- `profiles`: herkes kendi satırını okur/günceller. Öğretmen, `student_teacher` üzerinden kendisine bağlı öğrenci profillerini okur (`is_teacher_of`).
- `units`/`topics`/`outcomes`/`sub_outcomes`: **giriş yapmış herkes SELECT**. INSERT/UPDATE/DELETE yok (seed `service_role` ile).
- `student_teacher`:
  - `SELECT`: `teacher_id = auth.uid()` **VEYA** `student_id = auth.uid()` (her iki taraf da kendi bağını görür).
  - `INSERT`: yalnız `teacher_id = auth.uid()` ve `my_role() = 'teacher'` — pratikte yalnız `link_student_by_email` RPC'siyle yazılır.
  - `DELETE`: yalnız `teacher_id = auth.uid()`.
- `questions`:
  - `SELECT`: `student_id = auth.uid()` **VEYA** kaydın sahibi öğrencinin `student_teacher`'da bu öğretmene bağlı olması (`is_teacher_of`).
  - `INSERT`: yalnız `student_id = auth.uid()`.
  - `UPDATE`: öğrenci kendi kaydını (`teacher_note` HARİÇ); öğretmen yalnız `teacher_note`.
  - `DELETE`: yalnız kaydın sahibi öğrenci.
- **Storage `question-images`**: private bucket. Yükleme yolu `{auth.uid()}/...` ile başlamak zorunda. Okuma: sahibi + `student_teacher` ile bağlı öğretmen. Görsel `createSignedUrl` ile gösterilir.

> 🔒 Sonsuz döngü tuzağı: `questions` politikası içinde `profiles`'a bakan sorgu, `profiles` politikası da `questions`'a bakarsa recursion olur. Rol/öğretmen kontrolleri `security definer` fonksiyonlarla yapılır: `public.is_teacher_of(student uuid)` (artık `class_members`/`classes` değil `student_teacher` üzerinden kontrol eder), `public.my_role()`, `public.link_student_by_email(email)`.

---

## 4. Kodlama Kuralları

### 4.1 Mimari
1. **Server Component varsayılan.** `"use client"` yalnız: form state, `onClick`, `useState/useEffect`, Recharts. Sayfa dosyaları ASLA client olmaz — client kısım en yakın yaprak komponente iner.
2. **Veri çekme sunucuda.** Server Component içinde `createServerClient()` ile doğrudan Supabase. `useEffect` + `fetch` ile veri çekme YOK. API route yalnız gerçekten gerekirse.
3. **Yazma işlemleri Server Action.** `"use server"` + zod ile parse + `revalidatePath()`. Client'tan doğrudan `insert/update` çağırma.
4. **Tipler tek kaynaktan.** `npx supabase gen types typescript` → `src/types/database.ts`. Bu dosya elle düzenlenmez. Tablo tipi: `Tables<'questions'>`.
5. **`any` yasak.** Bilinmeyen için `unknown` + zod parse.
6. **Filtreler URL'de.** `?reason=misconception&from=2026-08-01` — `useState` değil `searchParams`. Paylaşılabilir, geri tuşu çalışır.

### 4.2 İsimlendirme
| Ne | Kural | Örnek |
|---|---|---|
| DB tablo/kolon | `snake_case`, tablo çoğul | `sub_outcomes`, `error_reason` |
| TS değişken/fonksiyon | `camelCase` | `errorReason`, `getStudentQuestions` |
| Komponent dosyası | `PascalCase.tsx` | `QuestionCard.tsx` |
| Diğer dosya | `kebab-case.ts` | `error-reason-badge.ts` |
| Rota klasörü | Türkçe, küçük harf | `app/(student)/panel/yeni/` |
| Sabit | `SCREAMING_SNAKE` | `ERROR_REASONS` |
| Boolean | `is/has/can` öneki | `isResolved`, `canEdit` |

**Dil kuralı:** Kod, tablo, değişken, enum → **İngilizce**. Arayüz metni, rota, yorum → **Türkçe**. Karışık kullanma.

### 4.3 UI / Tasarım Dili
- **shadcn/ui + Tailwind.** Özel CSS dosyası yazılmaz; `globals.css` yalnız tema değişkenleri içerir.
- **Renk:** nötr gri zemin (`zinc`), tek vurgu rengi **indigo**. Hata nedeni renkleri `constants.ts`'te sabit — kavram yanılgısı kırmızı, işlem hatası amber, dikkatsizlik mavi vb. **Aynı hata nedeni her ekranda aynı renk.**
- **Tipografi:** Inter. Başlık `text-2xl font-semibold tracking-tight`, gövde `text-sm`, yardımcı `text-xs text-muted-foreground`.
- **Boşluk:** 4'ün katları. Kart içi `p-4`/`p-6`, kart arası `gap-4`.
- **Kart:** `rounded-xl border bg-card` — gölge yerine kenarlık. Hover'da `transition-colors`, zıplama yok.
- **Zorunlu 3 durum:** her liste ekranı `loading` (skeleton), `empty` (ikon + ne yapması gerektiğini söyleyen metin), `error` (tekrar dene butonu) içerir.
- **Mobil öncelikli.** Öğrenci telefondan fotoğraf yükleyecek: kart grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.
- **Erişilebilirlik:** renk tek başına anlam taşımaz — rozet hem renkli hem metinli. Tüm ikon-butonda `aria-label`.

### 4.4 Görsel Yükleme Kuralı
Yüklemeden önce client'ta: en uzun kenar **1600px**'e indir, **WebP** kalite 0.8, hedef < 500KB. Kabul: `image/jpeg`, `image/png`, `image/webp`, `image/heic`. Ham dosya doğrudan Storage'a gitmez.

### 4.5 Token Verimliliği Kuralları (Claude için)
> Bu bölüm projeyi ucuz geliştirmek için var — **uy**.

1. **Dosya küçük kalsın:** bir dosya > 200 satır olursa böl. Büyük dosya = her okumada pahalı.
2. **Tam dosya okuma yok:** hedef bilinen değişiklikte Grep ile satırı bul, Edit ile değiştir. Dosyayı baştan yazma.
3. **Değişiklikten sonra doğrulama için dosyayı yeniden okuma.** Edit hata vermediyse yazıldı.
4. **Faz bitince özet:** ne eklendi, hangi dosyalar, sıradaki adım — 5 satır. Kod tekrar yazdırma.
5. **`ui/` klasörü okunmaz.** shadcn komponentleri hazır kabul edilir.
6. **SQL migration'lar append-only.** Eski migration düzenlenmez, yeni dosya eklenir.
7. **Şema değişikliği önce buraya yazılır**, sonra koda geçilir.
8. Uzun açıklama yerine kod + tek satır gerekçe.

### 4.6 Güvenlik
- `SUPABASE_SERVICE_ROLE_KEY` **yalnız** seed script'inde, asla `src/app` içinde.
- `.env.local` git'e girmez; `.env.example` anahtar isimleriyle tutulur.
- Yeni tablo → **aynı migration'da RLS ve politika.** RLS'siz tablo merge edilmez.
- Server Action'da her zaman `auth.getUser()` ile kullanıcı doğrula; client'tan gelen `student_id`'ye güvenme.

---

## 5. Fazlı Geliştirme Planı

Her faz **bağımsız test edilebilir** ve bir sonrakine geçmeden çalışır durumda olmalı.

### Faz 1 — Altyapı ✅ *tamamlandı*
Next.js + TS + Tailwind v4 · `lib/supabase/{client,server,middleware}.ts` · `constants.ts` (enum→Türkçe etiket + renk) · minimal `ui/` primitifleri (shadcn API-uyumlu) · `/saglik` teşhis sayfası · `proxy.ts` giriş kapısı.
Ayrıca **Faz 2'nin SQL ve auth kısmı da yazıldı**: 3 migration dosyası + giriş/kayıt/çıkış akışı (şifre **ve** Magic Link) + rol kapılı layout'lar.
**Bitti:** Supabase projesi bağlandı, migration'lar SQL Editor'de çalıştırıldı, Auth URL Configuration ayarlandı, `/saglik` tüm satırları yeşil.

### Faz 2 — Veritabanı & Auth (kalan iş)
`database.ts` migration şemasıyla elle doğrulandı (CLI ile üretim `supabase login` gerektirdiğinden headless ortamda yapılamadı — istenirse sonradan üretilip yerine konabilir) · **seed script yazıldı**: `scripts/seed-curriculum.ts` + `npm run seed:curriculum` — 9. sınıf örnek veriyle dolu, 10–12. sınıf TODO iskelet halinde, kullanıcının (fizik öğretmenliği öğrencisi) gözden geçirip tamamlaması gerekiyor · henüz kalan: `SUPABASE_SERVICE_ROLE_KEY`'in `.env.local`'e eklenip seed'in çalıştırılması, iki rolle uçtan uca manuel test (gerçek e-posta onayı gerektirdiğinden otomatikleştirilemedi).
**Bitti sayılır:** iki farklı rolle giriş yapılıyor, öğrenci öğretmen paneline erişemiyor, kazanım tablosu dolu.

### Faz 3 — Öğrenci Arayüzü (MVP çekirdeği)
`ImageUploader` (kamera + sürükle-bırak, client-side sıkıştırma, önizleme) · `OutcomeSelect` (Ünite → Konu → Kazanım → Alt Kazanım kademeli, aranabilir) · hata nedeni + durum seçimi (rozet grid) · kaynak & not alanları · `createQuestion` Server Action · `/panel/gecmis` kendi kayıtları listesi.
**Bitti sayılır:** öğrenci telefondan fotoğraf yükleyip etiketleyebiliyor, kaydı listede görüyor.

### Faz 4 — Öğretmen Paneli ✅ *tamamlandı*
`/ogretmen`: e-posta ile öğrenci bağlama formu (`link_student_by_email` RPC) + `student_teacher`'da kendine bağlı öğrenciler isim isim listelenir · `/ogretmen/ogrenci/[id]`: yalnız o öğrencinin sorusu fotoğrafları kronolojik listede, **"En Çok Yanlış Yapılan Konular"** tablosu (sunucuda `sub_outcome → outcome → topic` zincirinden aggregate edilip azalan sırada) · soru detay drawer'ı + `teacher_note` yazma.
**Bitti:** öğretmen bir öğrenciyi e-postayla ekliyor, listeden seçip tüm sorularını kronolojik görüyor, en çok yanlış yaptığı konuları sıralı tablo olarak görüyor.

### Faz 5 — Analiz
Özet kartlar (toplam kayıt, en sık hata nedeni, en zayıf ünite, çözüme kavuşma oranı) · hata nedeni dağılımı (bar) · ünite bazlı ısı haritası · zaman serisi (haftalık trend) · öğrenci karşılaştırma tablosu · CSV dışa aktarım.
**Bitti sayılır:** öğretmen tek ekranda tüm öğrencilerinin (toplu) en zayıf 3 alt kazanımını görüyor.

### Faz 6 — İyileştirme & Gelecek
Boş/hata durumlarının cilalanması · performans (görsel lazy-load, signed URL cache) · Vercel deploy · **sonra:** `veri/tyt-pdf/` içindeki 2020–2026 TYT kitapçıklarından soru havuzu çıkarma, kazanım eşleme, ÖSYM trend analizi. **AI/OCR ile otomatik kazanım önerisi kapsam dışı bırakıldı — bkz. §1 Kapsam Dışı, Karar #14.**

---

## 6. Karar Kaydı

| # | Karar | Gerekçe |
|---|---|---|
| 1 | 4 kademeli kazanım hiyerarşisi | "Fizikten kötü" değil "serbest cisim diyagramı çizemiyor" teşhisi ancak alt kazanım kırılımıyla mümkün |
| 2 | `error_reason` ayrı boyut | Aynı kazanımda hata nedeni bilgi eksikliği mi işlem hatası mı — öğretim müdahalesi tamamen farklı |
| 3 | Prisma/ORM yok | Supabase client + generate edilmiş tipler yeterli; ek katman ek token |
| 4 | Yetki RLS'te, uygulamada değil | Unutulan bir `if` veri sızdırır; unutulan RLS politikası erişimi tamamen kapatır (güvenli taraf) |
| 5 | Filtre state'i URL'de | Öğretmen "şu filtreyi" öğrenciyle/meslektaşla paylaşabilsin |
| 6 | Enum İngilizce, arayüz Türkçe | Migration ve kod okunabilirliği; çeviri tek dosyada |
| 7 | Storage private + signed URL | Öğrenci el yazısı ve fotoğrafı kişisel veridir, public bucket olmaz |
| 8 | Next 16, Next 15 değil | 15.x ağacındaki 3 yüksek önem açığı (CVE-2025-66478 + postcss/sharp) yalnız 16'da kapanıyor. `npm audit` → 0 açık |
| 9 | Kolon koruması RLS değil trigger | Postgres RLS kolon bazlı kısıtlama yapamaz; öğretmenin yalnız `teacher_note` yazması `guard_question_columns()` trigger'ı ile zorlanır |
| 10 | Rol kontrolü layout'ta, proxy'de değil | Proxy her istekte çalışır; oradaki ek DB sorgusu her sayfa yüklemesine gecikme bindirir |
| 11 | Magic link'te `shouldCreateUser: false` | Ad-soyad ve rol olmadan profil satırı anlamsız olur; kayıt akışı ayrı tutuldu |
| 12 | `ui/` primitifleri elle, shadcn API'siyle | Faz 1'de Radix bağımlılığı gereksiz. Aynı `variant`/`size` isimleri kullanıldı → Faz 3'te `npx shadcn add` bu dosyaları güvenle ezebilir |
| 13 | Sınıf yapısı (`classes`/`class_members`/`join_code`) kaldırıldı; öğretmen-öğrenci ilişkisi ayrı bir tabloyla kuruldu | Uygulama sınıf değil **özel ders** modelinde çalışıyor; tek öğretmen hesabı var, sınıf/şube/kod karmaşıklığının karşılığı yok (kesin kural) |
| 14 | AI/OCR entegrasyonu (OpenAI/Gemini, otomatik soru analizi) kalıcı olarak kapsam dışı — "MVP'de yok, sonra eklenir" değil | Ürün kararı: değerlendirme öğretmenin kendi teşhisiyle yapılır, otomasyon hedeflenmiyor (kesin kural) |
| 15 | Öğretmen-öğrenci bağı `profiles.teacher_id` değil, ayrı `student_teacher` tablosu | Tek kolon bugün yeterli (tek öğretmen) ama öğrencinin gelecekte birden fazla öğretmenle çalışması (vekalet, grup dersi) `profiles`'ı bozmadan desteklenebilsin diye ayrı ilişki tablosu; RLS politikaları da `classes`'takiyle aynı iskeleti (security definer `is_teacher_of`) kullanmaya devam ediyor |
| 16 | Öğrenci bağlama `join_code` yerine öğretmenin girdiği e-posta + `link_student_by_email` RPC | Öğrenci tarafında katılma adımı yok (öğretmen tek başına yönetiyor); RPC deseni `join_class_by_code`'un yerini alıyor — security definer ile `auth.users.email` araması RLS'i kontrollü şekilde genişletiyor |

---

## 7. Değişiklik Günlüğü
- **2026-08-20** — v0.5: Öğretmen-öğrenci ilişki modeli netleşti: `profiles.teacher_id` fikri terk edildi, yerine ayrı **`student_teacher`** tablosu geldi (Karar #15) — `0005_student_teacher.sql` migration'ı `classes`/`class_members`/`questions.class_id`/`join_class_by_code`'u kaldırıp `student_teacher` + `link_student_by_email` RPC'sini ekledi (Karar #16). Kod tarafı buna göre yeniden yazıldı: `/ogretmen` artık öğrenci listesi + e-posta ile ekleme formu, `/ogretmen/ogrenci/[id]` yeni — kronolojik soru listesi + "En Çok Yanlış Yapılan Konular" tablosu. Sınıf ile ilgili tüm rota/komponent/action (`ClassOperations`, `TeacherFilterBar`, `class-actions.ts`) kaldırıldı. Faz 4 tamamlandı.
- **2026-08-20** — v0.4: **Sınıf yapısı kaldırıldı** — `classes`/`class_members`/`join_code` silindi, yerine `profiles.teacher_id` ile doğrudan isim bazlı öğretmen-öğrenci ilişkisi geldi (Karar #13). **AI/OCR entegrasyonu kalıcı olarak kapsam dışı** (Karar #14). Öğretmen paneli planı (Faz 4) güncellendi: öğrenci listesi → öğrenci detayında kronolojik soru listesi + "En Çok Yanlış Yapılan Konular" tablosu (`GROUP BY konu ORDER BY toplam_yanlış DESC`). Ayrıca kayıt formu öğretmen rolüne kapatıldı (`signUpSchema.role` artık yalnız `"student"` kabul eder), tek öğretmen hesabı elle oluşturuldu.
- **2026-08-18** — v0.3: Supabase projesi canlı, migration'lar çalıştırıldı, `/saglik` tamamen yeşil. `database.ts` şemayla elle doğrulandı. `scripts/seed-curriculum.ts` yazıldı (9. sınıf örnek, 10–12 TODO).
- **2026-08-17** — v0.2: Faz 1 kod tarafı tamamlandı. Next 15 → 16 (güvenlik), `middleware.ts` → `proxy.ts`, 3 migration + auth akışı yazıldı. Kararlar 8–12 eklendi.
- **2026-08-17** — v0.1: İlk beyin dosyası. Faz 0 tamamlandı, Faz 1 onay bekliyor.
