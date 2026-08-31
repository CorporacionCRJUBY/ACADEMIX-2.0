// FILE: backend/src/utils/dateUtils.js
/**
 * Formatea una fecha a string YYYY-MM-DD
 */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Formatea una fecha a string DD/MM/YYYY
 */
const formatDateLocal = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Obtiene el primer día del mes
 */
const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month - 1, 1);
};

/**
 * Obtiene el último día del mes
 */
const getLastDayOfMonth = (year, month) => {
  return new Date(year, month, 0);
};

/**
 * Verifica si una fecha es día hábil (lunes a viernes)
 */
const isWorkingDay = (date) => {
  const day = new Date(date).getDay();
  return day >= 1 && day <= 5;
};

/**
 * Obtiene el número de días hábiles en un mes
 */
const getWorkingDaysInMonth = (year, month, holidays = []) => {
  const firstDay = getFirstDayOfMonth(year, month);
  const lastDay = getLastDayOfMonth(year, month);
  let workingDays = 0;
  
  const holidayDates = holidays.map(h => formatDate(h));
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    if (isWorkingDay(d) && !holidayDates.includes(dateStr)) {
      workingDays++;
    }
  }
  
  return workingDays;
};

/**
 * Calcula la diferencia en días entre dos fechas
 */
const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d2 - d1);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Agrega días a una fecha
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Verifica si una fecha es válida
 */
const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

/**
 * Obtiene el año académico a partir de una fecha
 */
const getAcademicYear = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  // Si es agosto o después, es el año académico que comienza en ese año
  // Si es antes de agosto, es el año académico que comenzó el año anterior
  return month >= 8 ? year : year - 1;
};

module.exports = {
  formatDate,
  formatDateLocal,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isWorkingDay,
  getWorkingDaysInMonth,
  daysBetween,
  addDays,
  isValidDate,
  getAcademicYear,
};