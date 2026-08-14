import express from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import db from '../db/init.js';

const router = express.Router();

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function safeFileName(name) {
  return String(name || 'Proyek')
    .replace(/[<>:"/\\|?*]+/g, '-')
    .trim();
}

// ============================================================
// AMBIL DATA LAPORAN LENGKAP
// Sumber utama:
// boq_item
//    └── boq_detail
//          ├── material
//          └── upah
// ============================================================
function getLaporanData(proyekId) {
  const proyek = db.prepare(`
    SELECT *
    FROM proyek
    WHERE id = ?
  `).get(proyekId);

  if (!proyek) {
    return null;
  }

  const boqItems = db.prepare(`
    SELECT *
    FROM boq_item
    WHERE proyek_id = ?
    ORDER BY urutan ASC, id ASC
  `).all(proyekId);

  const material = [];
  const upah = [];

  for (const item of boqItems) {
    const details = db.prepare(`
      SELECT
        id,
        boq_item_id,
        tipe,
        nama,
        satuan,
        koefisien,
        volume_kebutuhan,
        harga_satuan,
        subtotal
      FROM boq_detail
      WHERE boq_item_id = ?
      ORDER BY id ASC
    `).all(item.id);

    for (const detail of details) {
      const row = {
        boq_item_id: item.id,
        nama_pekerjaan: item.nama_pekerjaan,
        kategori: item.kategori || 'Lainnya',
        nama: detail.nama,
        satuan: detail.satuan,
        koefisien: Number(detail.koefisien || 0),
        volume: Number(detail.volume_kebutuhan || 0),
        harga_satuan: Number(detail.harga_satuan || 0),
        subtotal: Number(detail.subtotal || 0)
      };

      if (detail.tipe === 'material') {
        material.push(row);
      }

      if (detail.tipe === 'upah') {
        upah.push(row);
      }
    }
  }

  // Hitung dari detail agar laporan benar-benar mengikuti
  // data detail BOQ.
  const totalMaterial = material.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const totalUpah = upah.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const grandTotal = totalMaterial + totalUpah;

  return {
    proyek,
    boqItems,
    material,
    upah,
    totalMaterial,
    totalUpah,
    grandTotal
  };
}

// ============================================================
// EXPORT EXCEL
// ============================================================
router.get('/:proyek_id/excel', async (req, res) => {
  try {
    const data = getLaporanData(req.params.proyek_id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Proyek tidak ditemukan.'
      });
    }

    const {
      proyek,
      material,
      upah,
      totalMaterial,
      totalUpah,
      grandTotal
    } = data;

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'DWI ARSITEK';
    workbook.lastModifiedBy = 'DWI ARSITEK';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('RAB');

    // ========================================================
    // JUDUL
    // ========================================================
    sheet.mergeCells('A1:E1');

    sheet.getCell('A1').value =
      'RENCANA ANGGARAN BIAYA (RAB)';

    sheet.getCell('A1').font = {
      bold: true,
      size: 16
    };

    sheet.getCell('A1').alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };

    sheet.getRow(1).height = 25;

    sheet.mergeCells('A2:E2');

    sheet.getCell('A2').value =
      proyek.nama_proyek || '-';

    sheet.getCell('A2').font = {
      bold: true,
      size: 13
    };

    sheet.getCell('A2').alignment = {
      horizontal: 'center'
    };

    // ========================================================
    // DATA PROYEK
    // ========================================================
    sheet.addRow([]);

    sheet.addRow([
      'Pemilik',
      proyek.pemilik || '-'
    ]);

    sheet.addRow([
      'Alamat',
      proyek.alamat || '-'
    ]);

    sheet.addRow([
      'Jenis Rumah',
      proyek.jenis_rumah || '-'
    ]);

    sheet.addRow([
      'Luas Bangunan',
      `${proyek.luas || 0} m²`
    ]);

    sheet.addRow([
      'Jumlah Lantai',
      proyek.jumlah_lantai || 1
    ]);

    // ========================================================
    // RINGKASAN
    // ========================================================
    sheet.addRow([]);

    const ringkasanTitle = sheet.addRow([
      'RINGKASAN BIAYA'
    ]);

    ringkasanTitle.font = {
      bold: true,
      size: 12
    };

    sheet.addRow([
      'Total Material',
      totalMaterial
    ]);

    sheet.addRow([
      'Total Upah',
      totalUpah
    ]);

    const grandRow = sheet.addRow([
      'GRAND TOTAL',
      grandTotal
    ]);

    grandRow.font = {
      bold: true
    };

    // ========================================================
    // TABEL MATERIAL
    // ========================================================
    sheet.addRow([]);

    const materialTitle = sheet.addRow([
      'TABEL MATERIAL'
    ]);

    materialTitle.font = {
      bold: true,
      size: 12
    };

    materialTitle.alignment = {
      horizontal: 'left'
    };

    const materialHeader = sheet.addRow([
      'Material',
      'Volume',
      'Satuan',
      'Harga Satuan',
      'Jumlah'
    ]);

    materialHeader.font = {
      bold: true
    };

    materialHeader.alignment = {
      horizontal: 'center'
    };

    for (const item of material) {
      sheet.addRow([
        item.nama,
        item.volume,
        item.satuan,
        item.harga_satuan,
        item.subtotal
      ]);
    }

    const materialTotalRow = sheet.addRow([
      '',
      '',
      '',
      'TOTAL MATERIAL',
      totalMaterial
    ]);

    materialTotalRow.font = {
      bold: true
    };

    // ========================================================
    // TABEL UPAH
    // ========================================================
    sheet.addRow([]);

    const upahTitle = sheet.addRow([
      'TABEL UPAH / TENAGA KERJA'
    ]);

    upahTitle.font = {
      bold: true,
      size: 12
    };

    const upahHeader = sheet.addRow([
      'Tenaga Kerja',
      'Volume',
      'Satuan',
      'Harga Satuan',
      'Jumlah'
    ]);

    upahHeader.font = {
      bold: true
    };

    upahHeader.alignment = {
      horizontal: 'center'
    };

    for (const item of upah) {
      sheet.addRow([
        item.nama,
        item.volume,
        item.satuan,
        item.harga_satuan,
        item.subtotal
      ]);
    }

    const upahTotalRow = sheet.addRow([
      '',
      '',
      '',
      'TOTAL UPAH',
      totalUpah
    ]);

    upahTotalRow.font = {
      bold: true
    };

    // ========================================================
    // GRAND TOTAL AKHIR
    // ========================================================
    sheet.addRow([]);

    const finalTotalRow = sheet.addRow([
      '',
      '',
      '',
      'GRAND TOTAL RAB',
      grandTotal
    ]);

    finalTotalRow.font = {
      bold: true,
      size: 12
    };

    // ========================================================
    // FORMAT ANGKA
    // ========================================================
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (
          typeof cell.value === 'number'
        ) {
          cell.numFmt = '#,##0';
        }
      });
    });

    // Format kolom harga
    for (let row = 1; row <= sheet.rowCount; row++) {
      sheet.getCell(row, 4).numFmt =
        '"Rp" #,##0';

      sheet.getCell(row, 5).numFmt =
        '"Rp" #,##0';
    }

    // ========================================================
    // LEBAR KOLOM
    // ========================================================
    sheet.getColumn(1).width = 35;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 20;

    // ========================================================
    // CATAT RIWAYAT
    // ========================================================
    const fileName =
      `RAB-${safeFileName(proyek.nama_proyek)}.xlsx`;

    db.prepare(`
      INSERT INTO laporan
      (proyek_id, jenis, nama_file)
      VALUES (?, 'Excel', ?)
    `).run(
      proyek.id,
      fileName
    );

    // ========================================================
    // DOWNLOAD
    // ========================================================
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {
    console.error('ERROR EXPORT EXCEL:', err);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Gagal membuat file Excel.',
        error: err.message
      });
    }
  }
});

// ============================================================
// EXPORT PDF
// ============================================================
router.get('/:proyek_id/pdf', (req, res) => {
  try {
    const data = getLaporanData(req.params.proyek_id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Proyek tidak ditemukan.'
      });
    }

    const {
      proyek,
      material,
      upah,
      totalMaterial,
      totalUpah,
      grandTotal
    } = data;

    const fileName =
      `RAB-${safeFileName(proyek.nama_proyek)}.pdf`;

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      bufferPages: true
    });

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    doc.pipe(res);

    // ========================================================
    // HELPER PDF
    // ========================================================
    const pageWidth = 515;

    function drawLine(y) {
      doc
        .moveTo(40, y)
        .lineTo(555, y)
        .stroke();
    }

    function checkPage(y, height = 30) {
      if (y + height > 760) {
        doc.addPage();
        return 40;
      }

      return y;
    }

    function drawTableHeader(y, columns) {
      doc
        .font('Helvetica-Bold')
        .fontSize(8);

      for (const col of columns) {
        doc.text(
          col.title,
          col.x,
          y,
          {
            width: col.width,
            align: col.align || 'left'
          }
        );
      }

      drawLine(y + 14);

      return y + 20;
    }

    function drawTableRow(y, columns) {
      doc
        .font('Helvetica')
        .fontSize(8);

      let maxHeight = 15;

      for (const col of columns) {
        const text = String(col.value ?? '');

        const h = doc.heightOfString(
          text,
          {
            width: col.width
          }
        );

        if (h > maxHeight) {
          maxHeight = h;
        }

        doc.text(
          text,
          col.x,
          y,
          {
            width: col.width,
            align: col.align || 'left'
          }
        );
      }

      drawLine(y + maxHeight + 5);

      return y + maxHeight + 10;
    }

    // ========================================================
    // HEADER
    // ========================================================
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(
        'RENCANA ANGGARAN BIAYA (RAB)',
        {
          align: 'center'
        }
      );

    doc.moveDown(0.4);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(
        proyek.nama_proyek || '-',
        {
          align: 'center'
        }
      );

    doc.moveDown(1);

    // ========================================================
    // DATA PROYEK
    // ========================================================
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('DATA PROYEK');

    doc.moveDown(0.3);

    doc
      .font('Helvetica')
      .fontSize(9);

    doc.text(
      `Pemilik             : ${proyek.pemilik || '-'}`
    );

    doc.text(
      `Alamat              : ${proyek.alamat || '-'}`
    );

    doc.text(
      `Jenis Rumah         : ${proyek.jenis_rumah || '-'}`
    );

    doc.text(
      `Luas Bangunan       : ${proyek.luas || 0} m²`
    );

    doc.text(
      `Jumlah Lantai       : ${proyek.jumlah_lantai || 1}`
    );

    doc.moveDown(1);

    // ========================================================
    // RINGKASAN
    // ========================================================
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('RINGKASAN BIAYA');

    doc.moveDown(0.3);

    doc
      .font('Helvetica')
      .fontSize(9);

    doc.text(
      `Total Material      : ${formatRupiah(totalMaterial)}`
    );

    doc.text(
      `Total Upah          : ${formatRupiah(totalUpah)}`
    );

    doc
      .font('Helvetica-Bold')
      .text(
        `GRAND TOTAL         : ${formatRupiah(grandTotal)}`
      );

    doc.moveDown(1.2);

    // ========================================================
    // TABEL MATERIAL
    // ========================================================
    let y = doc.y;

    y = checkPage(y, 60);

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(
        'TABEL MATERIAL',
        40,
        y
      );

    y += 22;

    const materialColumns = [
      {
        title: 'Material',
        x: 40,
        width: 190
      },
      {
        title: 'Volume',
        x: 230,
        width: 60,
        align: 'right'
      },
      {
        title: 'Satuan',
        x: 290,
        width: 55,
        align: 'center'
      },
      {
        title: 'Harga Satuan',
        x: 345,
        width: 95,
        align: 'right'
      },
      {
        title: 'Jumlah',
        x: 440,
        width: 115,
        align: 'right'
      }
    ];

    y = drawTableHeader(
      y,
      materialColumns
    );

    if (material.length === 0) {
      y = drawTableRow(
        y,
        [
          {
            value: 'Tidak ada data material.',
            x: 40,
            width: 515
          }
        ]
      );
    }

    for (const item of material) {
      y = checkPage(y, 35);

      // Jika pindah halaman, gambar header lagi
      if (y === 40) {
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(
            'TABEL MATERIAL',
            40,
            y
          );

        y += 22;

        y = drawTableHeader(
          y,
          materialColumns
        );
      }

      y = drawTableRow(
        y,
        [
          {
            value: item.nama,
            x: 40,
            width: 190
          },
          {
            value: String(item.volume),
            x: 230,
            width: 60,
            align: 'right'
          },
          {
            value: item.satuan,
            x: 290,
            width: 55,
            align: 'center'
          },
          {
            value: formatRupiah(
              item.harga_satuan
            ),
            x: 345,
            width: 95,
            align: 'right'
          },
          {
            value: formatRupiah(
              item.subtotal
            ),
            x: 440,
            width: 115,
            align: 'right'
          }
        ]
      );
    }

    y += 8;

    y = checkPage(y, 35);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        `TOTAL MATERIAL: ${formatRupiah(totalMaterial)}`,
        345,
        y,
        {
          width: 210,
          align: 'right'
        }
      );

    y += 25;

    // ========================================================
    // TABEL UPAH
    // ========================================================
    y = checkPage(y, 70);

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(
        'TABEL UPAH / TENAGA KERJA',
        40,
        y
      );

    y += 22;

    const upahColumns = [
      {
        title: 'Tenaga Kerja',
        x: 40,
        width: 190
      },
      {
        title: 'Volume',
        x: 230,
        width: 60,
        align: 'right'
      },
      {
        title: 'Satuan',
        x: 290,
        width: 55,
        align: 'center'
      },
      {
        title: 'Harga Satuan',
        x: 345,
        width: 95,
        align: 'right'
      },
      {
        title: 'Jumlah',
        x: 440,
        width: 115,
        align: 'right'
      }
    ];

    y = drawTableHeader(
      y,
      upahColumns
    );

    if (upah.length === 0) {
      y = drawTableRow(
        y,
        [
          {
            value: 'Tidak ada data upah.',
            x: 40,
            width: 515
          }
        ]
      );
    }

    for (const item of upah) {
      y = checkPage(y, 35);

      if (y === 40) {
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(
            'TABEL UPAH / TENAGA KERJA',
            40,
            y
          );

        y += 22;

        y = drawTableHeader(
          y,
          upahColumns
        );
      }

      y = drawTableRow(
        y,
        [
          {
            value: item.nama,
            x: 40,
            width: 190
          },
          {
            value: String(item.volume),
            x: 230,
            width: 60,
            align: 'right'
          },
          {
            value: item.satuan,
            x: 290,
            width: 55,
            align: 'center'
          },
          {
            value: formatRupiah(
              item.harga_satuan
            ),
            x: 345,
            width: 95,
            align: 'right'
          },
          {
            value: formatRupiah(
              item.subtotal
            ),
            x: 440,
            width: 115,
            align: 'right'
          }
        ]
      );
    }

    y += 8;

    y = checkPage(y, 35);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        `TOTAL UPAH: ${formatRupiah(totalUpah)}`,
        345,
        y,
        {
          width: 210,
          align: 'right'
        }
      );

    y += 30;

    // ========================================================
    // GRAND TOTAL AKHIR
    // ========================================================
    y = checkPage(y, 60);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(
        `GRAND TOTAL RAB: ${formatRupiah(grandTotal)}`,
        300,
        y,
        {
          width: 255,
          align: 'right'
        }
      );

    // ========================================================
    // FOOTER SETIAP HALAMAN
    // ========================================================
    const range = doc.bufferedPageRange();

    for (
      let i = range.start;
      i < range.start + range.count;
      i++
    ) {
      doc.switchToPage(i);

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('gray')
        .text(
          `DWI ARSITEK — RAB ${proyek.nama_proyek || ''} — Halaman ${i + 1}`,
          40,
          810,
          {
            width: 515,
            align: 'center'
          }
        );

      doc.fillColor('black');
    }

    // ========================================================
    // CATAT RIWAYAT
    // ========================================================
    db.prepare(`
      INSERT INTO laporan
      (proyek_id, jenis, nama_file)
      VALUES (?, 'PDF', ?)
    `).run(
      proyek.id,
      fileName
    );

    doc.end();

  } catch (err) {
    console.error('ERROR EXPORT PDF:', err);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Gagal membuat file PDF.',
        error: err.message
      });
    }
  }
});

// ============================================================
// RIWAYAT LAPORAN
// ============================================================
router.get('/riwayat/all', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        l.*,
        p.nama_proyek
      FROM laporan l
      LEFT JOIN proyek p
        ON l.proyek_id = p.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `).all();

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error('ERROR RIWAYAT LAPORAN:', err);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat laporan.'
    });
  }
});

export default router;