// FILE: backend/src/utils/codeGenerator.js
const db = require('../config/database');

/**
 * Official prefix mapping for ACADEMIX 2.0 (Rule 2)
 */
const PREFIX_MAP = {
  students: 'STU',
  teachers: 'TEA',
  guardians: 'GUA',
  documents: 'DOC',
  attendance: 'ATT',
  grades: 'GRA',
  scholarships: 'SCH',
  assignments: 'ASN',
  grade_change_requests: 'REQ',
  transcripts: 'TRN',
  reports: 'REP',
  audit: 'AUD',
  academic_history: 'AHI',
  credits: 'CRE',
  gpa: 'GPA',
  graduation: 'GRD',
  gransif: 'GRN',
  previous_schools: 'PSC',
  branches: 'BRC',
  roles: 'ROL',
  permissions: 'PRM',
  users: 'USR',
  academic_years: 'AYR',
  academic_periods: 'APR',
  calendar: 'CAL',
  subjects: 'SUB',
  medical_records: 'MED',
};

/**
 * Genera un código único secuencial con formato PREFIX-YYYY-XXXXXX
 * Usando la tabla code_sequences con bloqueo atómico
 * @param {string} prefix - Prefijo de 2-4 caracteres (ej. STU, TEA, GRA)
 * @returns {Promise<string>} Código generado (ej. STU-2026-000001)
 */
const generateCode = async (prefix) => {
  const year = new Date().getFullYear();
  const cleanPrefix = (PREFIX_MAP[prefix.toLowerCase()] || prefix).toUpperCase().slice(0, 4);

  try {
    let nextNumber = 1;

    await db.transaction(async (trx) => {
      // Intentar obtener la secuencia actual con FOR UPDATE
      const seqRecord = await trx('code_sequences')
        .where({ prefix: cleanPrefix, year })
        .forUpdate()
        .first();

      if (seqRecord) {
        nextNumber = seqRecord.last_number + 1;
        await trx('code_sequences')
          .where({ id: seqRecord.id })
          .update({
            last_number: nextNumber,
            updated_at: trx.fn.now(),
          });
      } else {
        nextNumber = 1;
        await trx('code_sequences').insert({
          prefix: cleanPrefix,
          last_number: 1,
          year,
        });
      }
    });

    const sequenceStr = String(nextNumber).padStart(6, '0');
    return `${cleanPrefix}-${year}-${sequenceStr}`;
  } catch {
    // Fallback seguro en caso de contingencia
    const timestamp = Date.now().toString().slice(-6);
    return `${cleanPrefix}-${year}-${timestamp}`;
  }
};

/**
 * Fallback síncrono para casos rápidos
 */
const generateCodeSimple = (prefix) => {
  const year = new Date().getFullYear();
  const cleanPrefix = (PREFIX_MAP[prefix.toLowerCase()] || prefix).toUpperCase().slice(0, 4);
  const timestamp = Date.now().toString().slice(-6);
  return `${cleanPrefix}-${year}-${timestamp}`;
};

module.exports = {
  generateCode,
  generateCodeSimple,
  PREFIX_MAP,
};
