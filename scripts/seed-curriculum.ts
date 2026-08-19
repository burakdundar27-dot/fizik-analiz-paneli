/**
 * Kazanım hiyerarşisi (units → topics → outcomes → sub_outcomes) seed script'i.
 *
 * 9. sınıf içeriği örnek olarak dolduruldu; 10-12. sınıf mufredat.txt'teki resmi MEB
 * programından üretildi (bkz. buildGradeUnits). Alt kazanımlar (a/b) bu script tarafından
 * türetildiği için gerçek süreç bileşenleriyle değiştirmek istersen elle düzenleyebilirsin.
 *
 * Çalıştırma:
 *   1) .env.local içine SUPABASE_SERVICE_ROLE_KEY'i kendin ekle (bu script SADECE
 *      burada bu anahtarı kullanır, src/app içine ASLA girmez).
 *   2) npm run seed:curriculum
 *
 * Idempotent: code alanı unique olduğundan tekrar çalıştırmak yeni satır eklemez.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Eksik ortam değişkeni: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env.local içinde dolu olmalı."
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type SubOutcomeSeed = { code: string; title: string; order_no: number };
type OutcomeSeed = { code: string; title: string; order_no: number; subOutcomes: SubOutcomeSeed[] };
type TopicSeed = { code: string; title: string; order_no: number; outcomes: OutcomeSeed[] };
type UnitSeed = { code: string; title: string; grade_level: number; order_no: number; topics: TopicSeed[] };

/**
 * 10-12. sınıf üniteleri MEB Fizik Dersi Öğretim Programı'ndaki (mufredat.txt) resmi
 * ünite/kazanım (FİZ.X.Y.Z) başlıklarından üretilir. Programda kazanımların altında ayrı
 * bir "konu" katmanı yok; şemamızın topics katmanını doldurmak için ünite başına tek,
 * ünite ile aynı adı taşıyan bir konu oluşturulur. Her kazanımın iki alt kazanımı (a/b)
 * bu script tarafından türetilir — gerçek süreç bileşenleri gerekiyorsa mufredat.txt'ten
 * elle genişletilebilir.
 */
function buildGradeUnits(grade: number, units: [string, string[]][]): UnitSeed[] {
  return units.map(([unitTitle, outcomeTitles], unitIdx) => {
    const unitNo = unitIdx + 1;
    const unitCode = `${grade}.${unitNo}`;
    return {
      code: unitCode,
      title: unitTitle,
      grade_level: grade,
      order_no: unitNo,
      topics: [
        {
          code: `${unitCode}.0`,
          title: unitTitle,
          order_no: 1,
          outcomes: outcomeTitles.map((title, outcomeIdx) => {
            const outcomeCode = `${unitCode}.${outcomeIdx + 1}`;
            return {
              code: outcomeCode,
              title,
              order_no: outcomeIdx + 1,
              subOutcomes: [
                { code: `${outcomeCode}.a`, title: `${title} — temel kavramlar`, order_no: 1 },
                { code: `${outcomeCode}.b`, title: `${title} — uygulama ve problem çözme`, order_no: 2 },
              ],
            };
          }),
        },
      ],
    };
  });
}

// ---------------------------------------------------------------------------
// 9. sınıf örnek olarak dolduruldu; 10-12. sınıf mufredat.txt'ten üretildi (aşağıda).
// ---------------------------------------------------------------------------
const CURRICULUM: UnitSeed[] = [
  {
    code: "9.1",
    title: "Fizik Bilimine Giriş",
    grade_level: 9,
    order_no: 1,
    topics: [
      {
        code: "9.1.1",
        title: "Fizik Bilimi",
        order_no: 1,
        outcomes: [
          {
            code: "9.1.1.1",
            title: "Fiziğin doğası ve diğer bilimlerle ilişkisi",
            order_no: 1,
            subOutcomes: [
              { code: "9.1.1.1.a", title: "Fiziğin alt dalları", order_no: 1 },
              { code: "9.1.1.1.b", title: "Fizik-diğer bilimler ilişkisi", order_no: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    code: "9.2",
    title: "Madde ve Özellikleri",
    grade_level: 9,
    order_no: 2,
    topics: [
      {
        code: "9.2.1",
        title: "Madde ve Özkütle",
        order_no: 1,
        outcomes: [
          {
            code: "9.2.1.1",
            title: "Kütle, hacim, özkütle ilişkisi",
            order_no: 1,
            subOutcomes: [
              { code: "9.2.1.1.a", title: "Özkütle hesabı", order_no: 1 },
              { code: "9.2.1.1.b", title: "Karışımlarda özkütle", order_no: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    code: "9.3",
    title: "Hareket ve Kuvvet",
    grade_level: 9,
    order_no: 3,
    topics: [
      {
        code: "9.3.1",
        title: "Bir Boyutta Sabit Hızlı Hareket",
        order_no: 1,
        outcomes: [
          {
            code: "9.3.1.1",
            title: "Konum, yer değiştirme, hız kavramları",
            order_no: 1,
            subOutcomes: [
              { code: "9.3.1.1.a", title: "Konum-zaman grafiği yorumlama", order_no: 1 },
              { code: "9.3.1.1.b", title: "Hız hesabı", order_no: 2 },
            ],
          },
        ],
      },
      {
        code: "9.3.2",
        title: "Bir Boyutta Sabit İvmeli Hareket",
        order_no: 2,
        outcomes: [
          {
            code: "9.3.2.1",
            title: "İvme kavramı ve hareket denklemleri",
            order_no: 1,
            subOutcomes: [
              { code: "9.3.2.1.a", title: "Hız-zaman grafiği yorumlama", order_no: 1 },
              { code: "9.3.2.1.b", title: "Serbest düşme problemleri", order_no: 2 },
            ],
          },
        ],
      },
      {
        code: "9.3.3",
        title: "Newton'un Hareket Yasaları",
        order_no: 3,
        outcomes: [
          {
            code: "9.3.3.1",
            title: "Kuvvet, kütle, ivme ilişkisi",
            order_no: 1,
            subOutcomes: [
              { code: "9.3.3.1.a", title: "F=ma uygulamaları", order_no: 1 },
              { code: "9.3.3.1.b", title: "Etki-tepki kuvvetleri", order_no: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    code: "9.4",
    title: "Enerji",
    grade_level: 9,
    order_no: 4,
    topics: [
      {
        code: "9.4.1",
        title: "İş, Güç, Enerji",
        order_no: 1,
        outcomes: [
          {
            code: "9.4.1.1",
            title: "İş-enerji teoremi",
            order_no: 1,
            subOutcomes: [
              { code: "9.4.1.1.a", title: "Kinetik-potansiyel enerji dönüşümü", order_no: 1 },
              { code: "9.4.1.1.b", title: "Enerji korunumu problemleri", order_no: 2 },
            ],
          },
        ],
      },
    ],
  },

  ...buildGradeUnits(10, [
    ["Kuvvet ve Hareket", [
      "Yatay doğrultuda sabit hızlı hareket ile ilgili tümevarımsal akıl yürütebilme",
      "İvme ve hız değişimi arasındaki ilişkiye yönelik tümevarımsal akıl yürütebilme",
      "Yatay doğrultuda sabit ivmeyle hareket eden cisimlerin hareket grafiklerinden elde edilen matematiksel modelleri yorumlayabilme",
      "Serbest düşme hareketi yapan cisimlerin ivmesine yönelik tümevarımsal akıl yürütebilme",
      "Serbest düşme hareketi ile ilgili kanıt kullanabilme",
      "İki boyutta sabit ivmeli hareket ile ilgili tümevarımsal akıl yürütebilme",
    ]],
    ["Enerji", [
      "Kuvvet-yer değiştirme grafiği kullanılarak iş ile ilgili tümevarımsal akıl yürütebilme",
      "İş, enerji ve güç kavramlarına ilişkin çıkarım yapabilme",
      "Enerji biçimlerini karşılaştırabilme",
      "Mekanik enerjiyi çözümleyebilme",
      "Yenilenebilen ve yenilenemeyen enerji kaynaklarını karşılaştırabilme",
    ]],
    ["Elektrik", [
      "Basit elektrik devresinde potansiyel fark, elektrik akımı ve direnç kavramlarına ilişkin tümevarımsal akıl yürütebilme",
      "Elektrik yükünün hareketi üzerinden elektrik akımı kavramını çözümleyebilme",
      "Ohm Yasası ile ilgili tümevarımsal akıl yürütebilme",
      "Dirençlerin bağlanma türüne göre eşdeğer direncin büyüklüğüne ilişkin bilimsel çıkarım yapabilme",
      "Üreteçlerin bağlanma türüne göre devreye sağladıkları potansiyel farka ilişkin bilimsel çıkarım yapabilme",
      "Elektrik akımının oluşturabileceği tehlikelere karşı alınması gereken önlemleri sorgulayabilme",
      "Topraklama olayının önemini sorgulayabilme",
    ]],
    ["Dalgalar", [
      "Dalgaların temel kavramlarına ilişkin operasyonel tanımlama yapabilme",
      "Dalgaları özelliklerine göre sınıflandırabilme",
      "Dalgaların yayılma süratini etkileyen etmenlere ilişkin bilimsel gözleme dayalı çıkarım yapabilme",
      "Periyodik hareketlere ilişkin deneyimlerini yansıtabilme",
      "Su dalgalarında yansıma ve kırılma ile ilgili tümevarımsal akıl yürütebilme",
      "Rezonans ve depreme ilişkin kavramlar üzerinden depremi sorgulayabilme",
      "Depremle ilgili bilimsel model oluşturabilme",
    ]],
  ]),

  ...buildGradeUnits(11, [
    ["Kuvvet ve Hareket", [
      "Newton Hareket Yasaları ile ilgili tümevarımsal akıl yürütebilme",
      "Newton Hareket Yasaları'nı serbest cisim diyagramını kullanarak yorumlayabilme",
      "Statik ve kinetik sürtünme kuvvetlerini karşılaştırabilme",
      "Sürtünme kuvvetinin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme",
      "Limit hızı etkileyen değişkenler ile ilgili bilimsel çıkarım yapabilme",
      "Çembersel hareket yapan cisimlerin yörüngeleri ve hız vektörleri hakkında tümevarımsal akıl yürütebilme",
      "Çembersel hareketin değişkenleri arasındaki ilişkilerin matematiksel olarak ifade edilmesine ilişkin çıkarım yapabilme",
    ]],
    ["Elektrik ve Manyetizma", [
      "Elektrik yükleri arasındaki elektriksel kuvvetin matematiksel modeline yönelik tümevarımsal akıl yürütebilme",
      "Elektriksel alanın matematiksel modeline yönelik tümevarımsal akıl yürütebilme",
      "Faraday kafesi ve Faraday kafesinin kullanım alanları ile ilgili bilgi toplayabilme",
      "Mıknatısların birbiriyle etkileşimine yönelik bilimsel gözlem yapabilme",
      "Üzerinden akım geçen düz bir iletken telin oluşturduğu manyetik alana ilişkin çıkarım yapabilme",
      "Akım makarasının merkez ekseninde oluşan manyetik alanın matematiksel modeline ilişkin çıkarım yapabilme",
      "Elektromıknatısların kullanım alanlarına ilişkin bilgi toplayabilme",
      "Manyetik alanda akım geçen düz bir tele etki eden kuvvete ilişkin matematiksel model oluşturabilme",
      "Manyetik alanda akım geçen düz bir tele etki eden kuvvet ile ilgili deneyimini yansıtabilme",
      "Manyetik akıya etki eden etmenleri çözümleyebilme",
      "İndüksiyon geriliminin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme",
      "İndüklenme sonucu oluşan alternatif (değişken) akım hakkında bilimsel çıkarım yapabilme",
      "Transformatörün yapısı ve kullanım alanlarına yönelik bilimsel çıkarım yapabilme",
    ]],
    ["Madde ve Doğası", [
      "Yarı iletkenlerin kullanım alanları ve önemi ile ilgili sorgulama yapabilme",
      "Süper iletkenlerin kullanım alanları ve önemi ile ilgili sorgulama yapabilme",
    ]],
    ["Optik", [
      "Işık şiddeti, ışık akısı ve aydınlanma kavramlarına ilişkin bilimsel çıkarım yapabilme",
      "Düzlem aynaları kullanarak bilimsel model oluşturabilme",
      "Küresel aynaların özelliklerine ilişkin karşılaştırma yapabilme",
      "Küresel aynalarda görüntü oluşumu ile ilgili deney yapabilme",
      "Işığın saydam ortamlardaki davranışını kullanarak deney yapabilme",
      "Saydam ortamlarda görünür derinlik, gerçek derinlik ve ortamların ışığı kırma indisi ilişkisini karşılaştırabilme",
      "Fiber optik malzemelerin yapısı, çalışma prensibi ve kullanım alanlarına ilişkin bilgi toplayabilme",
      "Prizmalar ve prizmalarla kurulan birleşik sistemlerde ışığın izlediği yola ilişkin bilimsel model oluşturabilme",
      "Merceklerin özelliklerine ilişkin karşılaştırma yapabilme",
      "Merceklerde görüntü oluşumu ile ilgili deney yapabilme",
    ]],
  ]),

  ...buildGradeUnits(12, [
    ["Kuvvet ve Hareket", [
      "Torkun matematiksel modeline yönelik tümevarımsal akıl yürütebilme",
      "Denge, kütle merkezi ve ağırlık merkezi ile ilgili kanıt kullanabilme",
      "İtme (impuls) ve momentum değişimi arasındaki ilişkiye yönelik bilimsel çıkarım yapabilme",
      "Momentumun korunumunu veriye dayalı tahmin edebilme",
      "Eylemsizlik momentine yönelik tümevarımsal akıl yürütebilme",
      "Açısal momentumun korunumuna yönelik tümevarımsal akıl yürütebilme",
    ]],
    ["Enerji", [
      "Yay sabitini tanımlamak için deney yapabilme",
      "Yay sabitinin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme",
      "Yayın esneklik potansiyel enerjisinin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme",
      "Sürtünme kuvvetinin yaptığı işe yönelik tümevarımsal akıl yürütebilme",
      "Enerjinin dönüşümü ve korunumuna ilişkin bilimsel çıkarım yapabilme",
      "Mekanik sistemlerin verimi ile ilgili tümevarımsal akıl yürütebilme",
    ]],
    ["Dalgalar", [
      "Doğrusal su dalgalarında kırınım olayına ilişkin tümevarımsal akıl yürütebilme",
      "Işıkta kırınım ile ilgili deney yapabilme",
      "Dairesel su dalgalarında girişim olayına ilişkin tümevarımsal akıl yürütebilme",
      "Işıkta girişim ile ilgili deney yapabilme",
      "Elektromanyetik dalgaları sınıflandırabilme",
      "Işık renklerinin dalga boyları hakkında tümevarımsal akıl yürütebilme",
      "Mekanik veya elektromanyetik dalgaların kullanıldığı cihazlardaki dalga türlerini ilişkilendirebilme",
    ]],
    ["Madde ve Doğası", [
      "Planck sabitinin modern fiziğin doğuşundaki etkisini çözümleyebilme",
      "Fotoelektrik etkinin bağlı olduğu koşullar ve foton kavramına ilişkin tümevarımsal akıl yürütebilme",
      "Fotoelektrik etkinin uygulamaları ile ilgili sorgulama yapabilme",
      "Standart modelin bileşenlerini çözümleyebilme",
      "Modern Atom Teorisi ile ilgili bilgileri yapılandırabilme",
      "Nükleer enerjiyi sorgulayabilme",
    ]],
  ]),
];

async function upsertAndMap<T extends { code: string }>(
  table: "units" | "topics" | "outcomes" | "sub_outcomes",
  rows: Record<string, unknown>[]
): Promise<Map<string, string>> {
  if (rows.length === 0) return new Map();

  const { error: insertError } = await supabase
    .from(table)
    // @ts-expect-error - satır şekli tabloya göre değişken, çalışma zamanında doğru.
    .upsert(rows, { onConflict: "code", ignoreDuplicates: true });
  if (insertError) throw new Error(`${table} upsert hatası: ${insertError.message}`);

  const codes = rows.map((r) => r.code as string);
  const { data, error: selectError } = await supabase.from(table).select("id, code").in("code", codes);
  if (selectError) throw new Error(`${table} select hatası: ${selectError.message}`);

  return new Map((data ?? []).map((r) => [r.code, r.id]));
}

async function main() {
  const unitRows = CURRICULUM.map((u) => ({
    code: u.code,
    title: u.title,
    grade_level: u.grade_level,
    order_no: u.order_no,
  }));
  const unitIds = await upsertAndMap("units", unitRows);
  console.log(`units: ${unitIds.size} kayıt hazır`);

  const topicRows = CURRICULUM.flatMap((u) =>
    u.topics.map((t) => ({
      code: t.code,
      title: t.title,
      order_no: t.order_no,
      unit_id: unitIds.get(u.code),
    }))
  );
  const topicIds = await upsertAndMap("topics", topicRows);
  console.log(`topics: ${topicIds.size} kayıt hazır`);

  const outcomeRows = CURRICULUM.flatMap((u) =>
    u.topics.flatMap((t) =>
      t.outcomes.map((o) => ({
        code: o.code,
        title: o.title,
        order_no: o.order_no,
        topic_id: topicIds.get(t.code),
      }))
    )
  );
  const outcomeIds = await upsertAndMap("outcomes", outcomeRows);
  console.log(`outcomes: ${outcomeIds.size} kayıt hazır`);

  const subOutcomeRows = CURRICULUM.flatMap((u) =>
    u.topics.flatMap((t) =>
      t.outcomes.flatMap((o) =>
        o.subOutcomes.map((s) => ({
          code: s.code,
          title: s.title,
          order_no: s.order_no,
          outcome_id: outcomeIds.get(o.code),
        }))
      )
    )
  );
  const subOutcomeIds = await upsertAndMap("sub_outcomes", subOutcomeRows);
  console.log(`sub_outcomes: ${subOutcomeIds.size} kayıt hazır`);

  console.log("Seed tamamlandı.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
