import { ERROR_REASONS, type ErrorReason } from "@/lib/constants";

export type MonthlyReportData = {
  studentName: string;
  monthlyCount: number;
  rangeStart: string;
  rangeEnd: string;
  topTopics: { title: string; count: number }[];
  reasonCounts: { reason: ErrorReason; count: number }[];
};

const ZINC_900: [number, number, number] = [24, 24, 27];
const ZINC_500: [number, number, number] = [113, 113, 122];
const ZINC_200: [number, number, number] = [228, 228, 231];
const ZINC_50: [number, number, number] = [250, 250, 250];
const INDIGO_600: [number, number, number] = [79, 70, 229];
const INDIGO_50: [number, number, number] = [238, 242, 255];
const WHITE: [number, number, number] = [255, 255, 255];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9ığüşöç\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Aylık gelişim raporunu tek sayfalık, zinc/indigo temalı bir PDF olarak üretir ve indirir (brain §5 Faz 4.1). */
export async function generateMonthlyReportPdf(data: MonthlyReportData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;

  // ---- Başlık bandı ----
  doc.setFillColor(...INDIGO_600);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("FİZİK ANALİZ PANELİ", marginX, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Aylık Gelişim Raporu", marginX, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(data.studentName, marginX, 33);
  doc.setFontSize(9);
  doc.text(`${data.rangeStart} — ${data.rangeEnd}`, pageWidth - marginX, 33, { align: "right" });

  let y = 54;

  // ---- Özet kutusu ----
  doc.setFillColor(...ZINC_50);
  doc.setDrawColor(...ZINC_200);
  doc.roundedRect(marginX, y, contentWidth, 20, 2, 2, "FD");
  doc.setTextColor(...ZINC_500);
  doc.setFontSize(8);
  doc.text("BU AY YÜKLENEN SORU", marginX + 6, y + 8);
  doc.setTextColor(...ZINC_900);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(String(data.monthlyCount), marginX + 6, y + 16);

  const totalReasons = data.reasonCounts.reduce((sum, r) => sum + r.count, 0);
  const topReason = data.reasonCounts.reduce(
    (best, r) => (r.count > best.count ? r : best),
    { reason: "careless" as ErrorReason, count: 0 }
  );
  doc.setTextColor(...ZINC_500);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("EN SIK HATA NEDENİ", marginX + contentWidth / 2, y + 8);
  doc.setTextColor(...ZINC_900);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(topReason.count > 0 ? ERROR_REASONS[topReason.reason].label : "—", marginX + contentWidth / 2, y + 16);

  y += 32;

  // ---- En çok yanlış yapılan ilk 3 konu ----
  doc.setTextColor(...ZINC_900);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("En Çok Yanlış Yapılan İlk 3 Konu", marginX, y);
  y += 6;

  if (data.topTopics.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...ZINC_500);
    doc.text("Bu ay için henüz veri yok.", marginX, y + 4);
    y += 12;
  } else {
    for (const [i, topic] of data.topTopics.entries()) {
      const rowY = y + i * 10;
      doc.setFillColor(...(i % 2 === 0 ? WHITE : ZINC_50));
      doc.rect(marginX, rowY, contentWidth, 10, "F");
      doc.setFillColor(...INDIGO_50);
      doc.circle(marginX + 5, rowY + 5, 3, "F");
      doc.setTextColor(...INDIGO_600);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(String(i + 1), marginX + 5, rowY + 6.3, { align: "center" });
      doc.setTextColor(...ZINC_900);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(topic.title, marginX + 12, rowY + 6.5, { maxWidth: contentWidth - 30 });
      doc.setFont("helvetica", "bold");
      doc.text(`${topic.count}`, marginX + contentWidth - 4, rowY + 6.5, { align: "right" });
    }
    y += data.topTopics.length * 10 + 6;
  }

  // ---- Hata nedeni dağılımı ----
  doc.setTextColor(...ZINC_900);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Hata Nedeni Dağılımı", marginX, y);
  y += 8;

  const sortedReasons = [...data.reasonCounts].sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...sortedReasons.map((r) => r.count));
  const barTrackWidth = contentWidth - 62;

  for (const r of sortedReasons) {
    const label = ERROR_REASONS[r.reason].label;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...ZINC_900);
    doc.text(label, marginX, y + 4, { maxWidth: 44 });

    doc.setFillColor(...ZINC_200);
    doc.roundedRect(marginX + 46, y, barTrackWidth, 4, 1, 1, "F");
    const barWidth = (r.count / maxCount) * barTrackWidth;
    if (barWidth > 0) {
      doc.setFillColor(...INDIGO_600);
      doc.roundedRect(marginX + 46, y, Math.max(barWidth, 2), 4, 1, 1, "F");
    }

    doc.setTextColor(...ZINC_500);
    doc.setFontSize(9);
    doc.text(String(r.count), marginX + contentWidth, y + 4, { align: "right" });
    y += 8;
  }

  if (totalReasons === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...ZINC_500);
    doc.text("Bu ay için henüz hata nedeni verisi yok.", marginX, y + 2);
    y += 10;
  }

  // ---- Alt bilgi ----
  const footerY = 283;
  doc.setDrawColor(...ZINC_200);
  doc.line(marginX, footerY, pageWidth - marginX, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...ZINC_500);
  doc.text(
    `Bu rapor Fizik Analiz Paneli tarafından ${new Date().toLocaleDateString("tr-TR")} tarihinde otomatik oluşturulmuştur.`,
    marginX,
    footerY + 6
  );

  doc.save(`${slugify(data.studentName)}-aylik-gelisim-raporu.pdf`);
}
