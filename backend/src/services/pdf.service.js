// FILE: backend/src/services/pdf.service.js
const fs = require('fs');
const path = require('path');
// pdfmake >=0.3 expone directamente una instancia singleton con
// .setFonts()/.createPdf(), a diferencia de la vieja API "new PdfPrinter(fonts)".
// Importante: usar el entry point de Node ('pdfmake'), NO 'pdfmake/build/pdfmake'
// (ese build es el bundle para navegador y no tiene acceso al filesystem).
const pdfPrinter = require('pdfmake');

// Rutas absolutas a las fuentes Roboto que trae el propio paquete pdfmake
const ROBOTO_DIR = path.join(path.dirname(require.resolve('pdfmake/package.json')), 'fonts', 'Roboto');

// Fuentes estándar incluidas en pdfmake
const fonts = {
  Roboto: {
    normal: path.join(ROBOTO_DIR, 'Roboto-Regular.ttf'),
    bold: path.join(ROBOTO_DIR, 'Roboto-Medium.ttf'),
    italics: path.join(ROBOTO_DIR, 'Roboto-Italic.ttf'),
    bolditalics: path.join(ROBOTO_DIR, 'Roboto-MediumItalic.ttf')
  }
};

// Configuración de fuentes estándar del sistema
const standardFonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

class PDFService {
  constructor() {
    this.outputDir = path.resolve(__dirname, '../../uploads/pdfs');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const availableFonts = {
      ...fonts,
      ...standardFonts
    };

    // pdfPrinter es un singleton (mismo módulo cacheado por Node), por lo que
    // basta con registrar las fuentes una sola vez aquí.
    pdfPrinter.setFonts(availableFonts);
    // Nota: pdfmake exige definir setUrlAccessPolicy()/setLocalAccessPolicy()
    // para no emitir warnings, pero bloquear el acceso local también impide
    // cargar las fuentes (Roboto/Helvetica) que este servicio necesita.
    // Si en el futuro los docDefinition incluyen imágenes desde URLs externas
    // controladas por el usuario, definir aquí una política restrictiva real.
    pdfPrinter.setUrlAccessPolicy(() => false);
    this.printer = pdfPrinter;
  }

  /**
   * Helper para compilar un docDefinition a archivo PDF en disco
   */
  async buildPdf(docDefinition, filename) {
    const outputPath = path.join(this.outputDir, filename);
    // Usar Helvetica como fuente predeterminada
    docDefinition.defaultStyle = {
      font: 'Helvetica',
      fontSize: 9,
      color: '#222222',
      ...(docDefinition.defaultStyle || {})
    };

    // API nueva: createPdf() devuelve un documento "server" con .write(path)
    const pdfDoc = this.printer.createPdf(docDefinition);
    await pdfDoc.write(outputPath);

    return {
      path: outputPath,
      filename,
      url: `/uploads/pdfs/${filename}`
    };
  }

  /**
   * 1. PROGRESS REPORT / REPORT CARD (RP 26-27 TEMPLATE)
   */
  async generateReportCard({ student, grades = [], attendance = {}, teacherName = '', reportType = 'REPORT CARD', schoolInfo = {} }) {
    const filename = `ReportCard_${student.code || student.id}_${Date.now()}.pdf`;
    
    const schoolName = schoolInfo.name || 'NEW DIRECTION ACADEMY';
    const academicYear = schoolInfo.academicYear || '2026 - 2027';
    const schoolAddress = schoolInfo.address || '3501 W Vine Street Suite, 225, Kissimmee FL 34741';
    const schoolPhone = schoolInfo.phone || 'P: 407-201-6767';
    const schoolMotto = schoolInfo.motto || 'A SCHOOL WHERE EVERYONE IS SOMEONE';

    // Construir filas de materias
    const courseRows = [
      [
        { text: 'ACADEMIC COURSE', bold: true, fillColor: '#4B1C71', color: '#FFFFFF' },
        { text: 'Q1 PROG', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', alignment: 'center' },
        { text: 'Q1 REPORT', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', alignment: 'center' },
        { text: 'Q2 PROG', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', alignment: 'center' },
        { text: 'Q2 REPORT', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', alignment: 'center' },
        { text: 'FINAL', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', alignment: 'center' }
      ]
    ];

    if (grades.length === 0) {
      // Filas por defecto
      const defaultCourses = ['ENGLISH', 'MATH', 'SCIENCE', 'SOCIAL STUDIES', 'ELECTIVES'];
      defaultCourses.forEach(c => {
        courseRows.push([
          { text: c, bold: true },
          { text: '--', alignment: 'center' },
          { text: '--', alignment: 'center' },
          { text: '--', alignment: 'center' },
          { text: '--', alignment: 'center' },
          { text: '--', alignment: 'center', bold: true }
        ]);
      });
    } else {
      grades.forEach(g => {
        courseRows.push([
          { text: g.subject_name || g.course || 'Subject', bold: true },
          { text: g.q1_prog !== undefined ? String(g.q1_prog) : '--', alignment: 'center' },
          { text: g.q1_report !== undefined ? String(g.q1_report) : '--', alignment: 'center' },
          { text: g.q2_prog !== undefined ? String(g.q2_prog) : '--', alignment: 'center' },
          { text: g.q2_report !== undefined ? String(g.q2_report) : '--', alignment: 'center' },
          { text: g.final !== undefined ? String(g.final) : '--', alignment: 'center', bold: true }
        ]);
      });
    }

    const docDefinition = {
      pageSize: 'LETTER',
      pageOrientation: 'portrait',
      pageMargins: [36, 36, 36, 36],
      content: [
        // Encabezado institucional
        { text: schoolName, fontSize: 16, bold: true, alignment: 'center', color: '#4B1C71' },
        { text: academicYear, fontSize: 12, bold: true, alignment: 'center', margin: [0, 2, 0, 2] },
        { text: `${schoolAddress} | ${schoolPhone}`, fontSize: 9, alignment: 'center', color: '#555555' },
        { text: `"${schoolMotto}"`, fontSize: 9, italics: true, alignment: 'center', margin: [0, 2, 0, 10], color: '#4B1C71' },

        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 540, y2: 0, lineWidth: 1.5, lineColor: '#4B1C71' }],
          margin: [0, 0, 0, 10]
        },

        // Student Info
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                { text: [{ text: 'Student Name: ', bold: true }, `${student.first_name || ''} ${student.last_name || ''}`.trim()] },
                { text: [{ text: 'Grade Level: ', bold: true }, String(student.grade || 'N/A')] }
              ],
              [
                { text: [{ text: 'Student Code: ', bold: true }, student.code || 'N/A'] },
                { text: [{ text: 'Date Printed: ', bold: true }, new Date().toLocaleDateString('en-US')] }
              ],
              [
                { text: [{ text: 'Teacher: ', bold: true }, teacherName || 'Academic Staff'] },
                { text: [{ text: 'Document Type: ', bold: true }, reportType] }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 12]
        },

        // Tabla de Calificaciones
        {
          table: {
            headerRows: 1,
            widths: ['40%', '12%', '12%', '12%', '12%', '12%'],
            body: courseRows
          },
          layout: {
            fillColor: (rowIndex) => (rowIndex % 2 === 0 && rowIndex > 0 ? '#F9F6FC' : null),
            hLineColor: () => '#C8A2C8',
            vLineColor: () => '#C8A2C8'
          },
          margin: [0, 0, 0, 14]
        },

        // Asistencia integrada (Academics & Attendance)
        { text: 'ACADEMICS & ATTENDANCE', fontSize: 10, bold: true, color: '#4B1C71', margin: [0, 0, 0, 4] },
        {
          table: {
            headerRows: 1,
            widths: ['40%', '12%', '12%', '12%', '12%', '12%'],
            body: [
              [
                { text: 'Attendance Category', bold: true, fillColor: '#E6E6FA' },
                { text: 'Q1', bold: true, alignment: 'center', fillColor: '#E6E6FA' },
                { text: 'Q2', bold: true, alignment: 'center', fillColor: '#E6E6FA' },
                { text: 'Q3', bold: true, alignment: 'center', fillColor: '#E6E6FA' },
                { text: 'Q4', bold: true, alignment: 'center', fillColor: '#E6E6FA' },
                { text: 'TOTAL', bold: true, alignment: 'center', fillColor: '#E6E6FA' }
              ],
              [
                { text: 'Days Present' },
                { text: String(attendance.q1_present || 0), alignment: 'center' },
                { text: String(attendance.q2_present || 0), alignment: 'center' },
                { text: String(attendance.q3_present || 0), alignment: 'center' },
                { text: String(attendance.q4_present || 0), alignment: 'center' },
                { text: String(attendance.total_present || 0), alignment: 'center', bold: true }
              ],
              [
                { text: 'Days Absence' },
                { text: String(attendance.q1_absence || 0), alignment: 'center' },
                { text: String(attendance.q2_absence || 0), alignment: 'center' },
                { text: String(attendance.q3_absence || 0), alignment: 'center' },
                { text: String(attendance.q4_absence || 0), alignment: 'center' },
                { text: String(attendance.total_absence || 0), alignment: 'center', bold: true }
              ],
              [
                { text: 'Tardy to School' },
                { text: String(attendance.q1_tardy || 0), alignment: 'center' },
                { text: String(attendance.q2_tardy || 0), alignment: 'center' },
                { text: String(attendance.q3_tardy || 0), alignment: 'center' },
                { text: String(attendance.q4_tardy || 0), alignment: 'center' },
                { text: String(attendance.total_tardy || 0), alignment: 'center', bold: true }
              ]
            ]
          },
          layout: {
            hLineColor: () => '#C8A2C8',
            vLineColor: () => '#C8A2C8'
          },
          margin: [0, 0, 0, 14]
        },

        // Comments
        { text: 'NOTES / COMMENTS:', fontSize: 9, bold: true, color: '#4B1C71' },
        {
          table: {
            widths: ['100%'],
            body: [[{ text: student.notes || 'Student shows good academic dedication and consistent progress.', minHeight: 35, margin: [4, 4, 4, 4] }]]
          },
          layout: { hLineColor: () => '#C8A2C8', vLineColor: () => '#C8A2C8' },
          margin: [0, 2, 0, 20]
        },

        // Signatures
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: '______________________________________', alignment: 'center' },
                { text: 'Parent / Guardian Signature', fontSize: 8, alignment: 'center', margin: [0, 2, 0, 0] },
                { text: 'Date: ________________________', fontSize: 8, alignment: 'center', margin: [0, 4, 0, 0] }
              ]
            },
            {
              width: '50%',
              stack: [
                { text: '______________________________________', alignment: 'center' },
                { text: 'Principal / Academic Director', fontSize: 8, alignment: 'center', margin: [0, 2, 0, 0] },
                { text: 'Date: ________________________', fontSize: 8, alignment: 'center', margin: [0, 4, 0, 0] }
              ]
            }
          ]
        }
      ]
    };

    return this.buildPdf(docDefinition, filename);
  }

  /**
   * 2. OFFICIAL HIGH SCHOOL TRANSCRIPT (NEW HIGH SCHOOL TRANSCRIPT 26-27 TEMPLATE)
   */
  async generateTranscript({ student, academicHistory = [], previousSchools = [], summary = {}, schoolInfo = {} }) {
    const filename = `OfficialTranscript_${student.code || student.id}_${Date.now()}.pdf`;

    const schoolName = schoolInfo.name || 'NEW DIRECTION ACADEMY';
    const schoolAddress = schoolInfo.address || '3501 W Vine Street Suite, 225, Kissimmee FL 34741';
    const schoolPhone = schoolInfo.phone || 'P: 407-201-6767';

    // Agrupar historia académica por año/grado
    const historyByYear = {};
    academicHistory.forEach(item => {
      const yearKey = `${item.academic_year_name || 'Academic Year'} - Grade ${item.grade || ''}`;
      if (!historyByYear[yearKey]) historyByYear[yearKey] = [];
      historyByYear[yearKey].push(item);
    });

    const historyContent = [];
    Object.keys(historyByYear).forEach(yearKey => {
      const courses = historyByYear[yearKey];
      const tableBody = [
        [
          { text: 'Course Title', bold: true, fillColor: '#4B1C71', color: '#FFFFFF' },
          { text: 'Credits Earned', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', alignment: 'center' },
          { text: 'Final Grade', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', alignment: 'center' },
          { text: 'GPA', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', alignment: 'center' }
        ]
      ];

      courses.forEach(c => {
        tableBody.push([
          { text: c.subject_name || c.course_title || 'Subject' },
          { text: Number(c.credits || 1.0).toFixed(2), alignment: 'center' },
          { text: String(c.grade_value || c.final_grade || 'N/A'), alignment: 'center' },
          { text: Number(c.gpa || 3.0).toFixed(2), alignment: 'center' }
        ]);
      });

      historyContent.push(
        { text: yearKey, fontSize: 10, bold: true, color: '#4B1C71', margin: [0, 6, 0, 2] },
        {
          table: {
            headerRows: 1,
            widths: ['55%', '15%', '15%', '15%'],
            body: tableBody
          },
          layout: {
            fillColor: (idx) => (idx % 2 === 0 && idx > 0 ? '#F9F6FC' : null),
            hLineColor: () => '#C8A2C8',
            vLineColor: () => '#C8A2C8'
          },
          margin: [0, 0, 0, 6]
        }
      );
    });

    // Previous schools rows
    const prevSchoolRows = [
      [
        { text: 'School Name', bold: true, fillColor: '#E6E6FA' },
        { text: 'Location', bold: true, fillColor: '#E6E6FA' },
        { text: 'Years Attended', bold: true, alignment: 'center', fillColor: '#E6E6FA' },
        { text: 'Credits Transferred', bold: true, alignment: 'center', fillColor: '#E6E6FA' }
      ]
    ];

    if (previousSchools.length === 0) {
      prevSchoolRows.push([
        { text: 'None recorded' },
        { text: 'N/A' },
        { text: 'N/A', alignment: 'center' },
        { text: '0.00', alignment: 'center' }
      ]);
    } else {
      previousSchools.forEach(ps => {
        prevSchoolRows.push([
          { text: ps.school_name || 'School' },
          { text: ps.address || 'Location' },
          { text: ps.year_attended || 'N/A', alignment: 'center' },
          { text: Number(ps.credits_transferred || 0).toFixed(2), alignment: 'center' }
        ]);
      });
    }

    const docDefinition = {
      pageSize: 'LETTER',
      pageOrientation: 'portrait',
      pageMargins: [36, 36, 36, 36],
      content: [
        // Header
        { text: schoolName, fontSize: 16, bold: true, alignment: 'center', color: '#4B1C71' },
        { text: 'OFFICIAL HIGH SCHOOL TRANSCRIPT', fontSize: 13, bold: true, alignment: 'center', margin: [0, 2, 0, 2], color: '#333333' },
        { text: `${schoolAddress} | ${schoolPhone}`, fontSize: 9, alignment: 'center', color: '#666666', margin: [0, 0, 0, 8] },

        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 540, y2: 0, lineWidth: 1.5, lineColor: '#4B1C71' }],
          margin: [0, 0, 0, 8]
        },

        // Student Information
        { text: 'STUDENT INFORMATION', fontSize: 10, bold: true, color: '#4B1C71', margin: [0, 0, 0, 4] },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                { text: [{ text: 'Full Name: ', bold: true }, `${student.first_name || ''} ${student.last_name || ''}`.trim()] },
                { text: [{ text: 'Student Code: ', bold: true }, student.code || 'N/A'] }
              ],
              [
                { text: [{ text: 'Date of Birth: ', bold: true }, student.date_of_birth || 'N/A'] },
                { text: [{ text: 'Graduation Status: ', bold: true }, student.status === 'GRADUATED' ? 'GRADUATED' : 'CANDIDATE'] }
              ],
              [
                { text: [{ text: 'Address: ', bold: true }, student.address || 'N/A'] },
                { text: [{ text: 'Phone: ', bold: true }, student.phone || 'N/A'] }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 10]
        },

        // Academic Record
        { text: 'ACADEMIC RECORD & COURSE HISTORY', fontSize: 10, bold: true, color: '#4B1C71', margin: [0, 4, 0, 2] },
        ...historyContent,

        // Credits and GPA summary
        { text: 'CREDITS & GPA SUMMARY', fontSize: 10, bold: true, color: '#4B1C71', margin: [0, 6, 0, 2] },
        {
          table: {
            widths: ['33%', '33%', '34%'],
            body: [
              [
                { text: [{ text: 'Total Credits Earned: ', bold: true }, Number(summary.totalCredits || 24.0).toFixed(2)] },
                { text: [{ text: 'Cumulative GPA: ', bold: true }, Number(summary.cumulativeGPA || 3.85).toFixed(2)] },
                { text: [{ text: 'Diploma Earned: ', bold: true }, summary.diplomaEarned || 'Standard High School Diploma'] }
              ]
            ]
          },
          layout: { hLineColor: () => '#C8A2C8', vLineColor: () => '#C8A2C8' },
          margin: [0, 0, 0, 8]
        },

        // Other schools attended
        { text: 'LIST OF OTHER SCHOOLS ATTENDED', fontSize: 10, bold: true, color: '#4B1C71', margin: [0, 4, 0, 2] },
        {
          table: {
            headerRows: 1,
            widths: ['40%', '30%', '15%', '15%'],
            body: prevSchoolRows
          },
          layout: { hLineColor: () => '#C8A2C8', vLineColor: () => '#C8A2C8' },
          margin: [0, 0, 0, 14]
        },

        // Certification & Seal
        {
          table: {
            widths: ['100%'],
            body: [[{
              text: 'I hereby certify that this transcript is an accurate and official record of the academic work completed by the student named above.',
              fontSize: 8,
              italics: true,
              alignment: 'center',
              margin: [4, 4, 4, 4]
            }]]
          },
          layout: { hLineColor: () => '#E6E6FA', vLineColor: () => '#E6E6FA' },
          margin: [0, 0, 0, 16]
        },

        {
          columns: [
            {
              width: '40%',
              stack: [
                { text: '______________________________________', alignment: 'center' },
                { text: 'Principal / Registrar Signature', fontSize: 8, alignment: 'center', margin: [0, 2, 0, 0] },
                { text: `Date: ${new Date().toLocaleDateString('en-US')}`, fontSize: 8, alignment: 'center', margin: [0, 2, 0, 0] }
              ]
            },
            {
              width: '20%',
              text: ''
            },
            {
              width: '40%',
              stack: [
                { text: '[ OFFICIAL SCHOOL SEAL ]', fontSize: 9, bold: true, alignment: 'center', color: '#4B1C71', margin: [0, 10, 0, 0] }
              ]
            }
          ]
        }
      ]
    };

    return this.buildPdf(docDefinition, filename);
  }

  /**
   * 3. MONTHLY CLASS ATTENDANCE (LANDSCAPE A4)
   */
  async generateMonthlyAttendance({ assignment, gridData, month, year, schoolInfo = {} }) {
    const filename = `MonthlyAttendance_${assignment.code || assignment.id}_${year}_${month}_${Date.now()}.pdf`;
    const schoolName = schoolInfo.name || 'NEW DIRECTION HIGH SCHOOL';

    const days = gridData.days || [];
    const students = gridData.students || [];

    // Header de columnas de la tabla (1..31 + Totales)
    const headerRow1 = [
      { text: 'Last Name', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', fontSize: 7 },
      { text: 'First Name', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', fontSize: 7 },
      { text: 'Grade', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', fontSize: 7, alignment: 'center' }
    ];

    days.forEach(d => {
      headerRow1.push({
        text: String(d.dayNumber),
        bold: true,
        fillColor: d.isWeekend ? '#D9BED9' : '#4B1C71',
        color: d.isWeekend ? '#4B1C71' : '#FFFFFF',
        fontSize: 6,
        alignment: 'center'
      });
    });

    headerRow1.push(
      { text: 'O', bold: true, fillColor: '#29B6F6', color: '#FFFFFF', fontSize: 7, alignment: 'center' },
      { text: 'U', bold: true, fillColor: '#E53935', color: '#FFFFFF', fontSize: 7, alignment: 'center' },
      { text: 'E', bold: true, fillColor: '#FFA726', color: '#FFFFFF', fontSize: 7, alignment: 'center' },
      { text: 'P', bold: true, fillColor: '#4CAF50', color: '#FFFFFF', fontSize: 7, alignment: 'center' },
      { text: 'Rate%', bold: true, fillColor: '#4B1C71', color: '#FFFFFF', fontSize: 7, alignment: 'center' }
    );

    const bodyRows = [headerRow1];

    students.forEach(st => {
      const row = [
        { text: st.last_name || '', fontSize: 7 },
        { text: st.first_name || '', fontSize: 7 },
        { text: String(st.grade || ''), fontSize: 7, alignment: 'center' }
      ];

      days.forEach(d => {
        const val = st.records ? st.records[d.dayNumber] || '' : '';
        row.push({
          text: val,
          fontSize: 6,
          alignment: 'center',
          fillColor: d.isWeekend ? '#F0EDF5' : null
        });
      });

      const totals = st.totals || {};
      row.push(
        { text: String(totals.online || 0), fontSize: 7, alignment: 'center' },
        { text: String(totals.unexcused || 0), fontSize: 7, alignment: 'center' },
        { text: String(totals.excused || 0), fontSize: 7, alignment: 'center' },
        { text: String(totals.present || 0), fontSize: 7, alignment: 'center', bold: true },
        { text: `${totals.attendanceRate || 100}%`, fontSize: 7, alignment: 'center', bold: true }
      );

      bodyRows.push(row);
    });

    // Ancho dinámico de columnas
    const colWidths = [60, 60, 25];
    days.forEach(() => colWidths.push(14));
    colWidths.push(16, 16, 16, 16, 28);

    const docDefinition = {
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [20, 20, 20, 20],
      content: [
        { text: 'MONTHLY CLASS ATTENDANCE', fontSize: 14, bold: true, alignment: 'center', color: '#4B1C71' },
        { text: schoolName, fontSize: 11, bold: true, alignment: 'center', color: '#333333' },
        {
          text: `Teacher: ${assignment.teacher_name || 'N/A'} | Subject: ${assignment.subject_name || 'N/A'} | Grade: ${assignment.grade || ''} | Month: ${month}/${year}`,
          fontSize: 8,
          alignment: 'center',
          margin: [0, 2, 0, 8]
        },
        {
          table: {
            headerRows: 1,
            widths: colWidths,
            body: bodyRows
          },
          layout: {
            hLineColor: () => '#C8A2C8',
            vLineColor: () => '#C8A2C8'
          }
        },
        {
          text: 'Status Legend: P = Present | O = Online | E = Excused Absence | U = Unexcused Absence',
          fontSize: 7,
          italics: true,
          margin: [0, 6, 0, 0]
        }
      ]
    };

    return this.buildPdf(docDefinition, filename);
  }
}

module.exports = new PDFService();
