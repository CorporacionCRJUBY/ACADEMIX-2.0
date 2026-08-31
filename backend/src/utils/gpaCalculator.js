// FILE: backend/src/utils/gpaCalculator.js
/**
 * Calcula el GPA a partir de una lista de calificaciones
 * @param {Array} grades - Array de objetos con grade_value y credit_hours
 * @param {number} [scale=4.0] - Escala de GPA (4.0 o 5.0)
 * @returns {Object} GPA calculado
 */
const calculateGPA = (grades, scale = 4.0) => {
  if (!grades || grades.length === 0) {
    return { gpa: 0, totalPoints: 0, totalCredits: 0, gradeCount: 0 };
  }

  const gradePoints = grades.map(g => ({
    ...g,
    points: convertToGradePoints(g.grade_value, scale),
  }));

  let totalPoints = 0;
  let totalCredits = 0;

  for (const g of gradePoints) {
    const credits = g.credit_hours || 1;
    totalPoints += g.points * credits;
    totalCredits += credits;
  }

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    gpa: Math.round(gpa * 100) / 100,
    totalPoints,
    totalCredits,
    gradeCount: grades.length,
  };
};

/**
 * Convierte una calificación numérica a puntos de GPA
 */
const convertToGradePoints = (gradeValue, scale = 4.0) => {
  if (scale === 4.0) {
    if (gradeValue >= 90) return 4.0;
    if (gradeValue >= 80) return 3.0;
    if (gradeValue >= 70) return 2.0;
    if (gradeValue >= 60) return 1.0;
    return 0.0;
  } else {
    // Escala 5.0
    if (gradeValue >= 90) return 5.0;
    if (gradeValue >= 80) return 4.0;
    if (gradeValue >= 70) return 3.0;
    if (gradeValue >= 60) return 2.0;
    return 1.0;
  }
};

/**
 * Convierte una calificación numérica a letra
 */
const convertToLetterGrade = (gradeValue) => {
  if (gradeValue >= 90) return 'A';
  if (gradeValue >= 80) return 'B';
  if (gradeValue >= 70) return 'C';
  if (gradeValue >= 60) return 'D';
  return 'F';
};

/**
 * Calcula el GPA acumulativo a partir de múltiples períodos
 */
const calculateCumulativeGPA = (periodsData, scale = 4.0) => {
  let totalPoints = 0;
  let totalCredits = 0;

  for (const period of periodsData) {
    const result = calculateGPA(period.grades, scale);
    totalPoints += result.totalPoints;
    totalCredits += result.totalCredits;
  }

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    cumulativeGPA: Math.round(gpa * 100) / 100,
    totalPoints,
    totalCredits,
    periodsCount: periodsData.length,
  };
};

/**
 * Valida si un estudiante cumple con los requisitos de graduación
 */
const validateGraduationRequirements = (grades, requiredCredits, minGPA) => {
  const { gpa, totalCredits } = calculateGPA(grades, 4.0);
  const creditsMet = totalCredits >= requiredCredits;
  const gpaMet = gpa >= minGPA;
  
  return {
    meetsRequirements: creditsMet && gpaMet,
    creditsMet,
    gpaMet,
    currentGPA: gpa,
    currentCredits: totalCredits,
    requiredCredits,
    minGPA,
  };
};

module.exports = {
  calculateGPA,
  convertToGradePoints,
  convertToLetterGrade,
  calculateCumulativeGPA,
  validateGraduationRequirements,
};