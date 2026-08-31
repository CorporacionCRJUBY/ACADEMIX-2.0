// FILE: frontend/src/services/pdfService.js
import { api } from '../api/axiosClient';

/**
 * Servicio para generar y descargar archivos PDF
 */
class PDFService {
  /**
   * Genera un reporte de progreso
   */
  async generateProgressReport(studentId, periodId) {
    try {
      const response = await api.post('/progress-reports/generate', {
        student_id: studentId,
        academic_period_id: periodId,
      });
      return response;
    } catch (error) {
      console.error('Error generating progress report:', error);
      throw error;
    }
  }

  /**
   * Genera una boleta de calificaciones
   */
  async generateReportCard(studentId, periodId) {
    try {
      const response = await api.post('/report-cards/generate', {
        student_id: studentId,
        academic_period_id: periodId,
      });
      return response;
    } catch (error) {
      console.error('Error generating report card:', error);
      throw error;
    }
  }

  /**
   * Genera un transcript académico
   */
  async generateTranscript(studentId, periodId) {
    try {
      const response = await api.post('/transcripts/generate', {
        student_id: studentId,
        academic_period_id: periodId,
      });
      return response;
    } catch (error) {
      console.error('Error generating transcript:', error);
      throw error;
    }
  }

  /**
   * Descarga un PDF por su ID
   */
  async downloadPdf(url, filename) {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      return response;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Previsualiza un PDF en una nueva ventana
   */
  async previewPdf(url) {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response], { type: 'application/pdf' });
      const urlBlob = URL.createObjectURL(blob);
      window.open(urlBlob, '_blank');
      setTimeout(() => URL.revokeObjectURL(urlBlob), 60000);
      
      return response;
    } catch (error) {
      console.error('Error previewing PDF:', error);
      throw error;
    }
  }

  /**
   * Genera un reporte de asistencia
   */
  async generateAttendanceReport(assignmentId, month, year) {
    try {
      const response = await api.post('/reports/generate', {
        category: 'attendance',
        assignment_id: assignmentId,
        month,
        year,
      });
      return response;
    } catch (error) {
      console.error('Error generating attendance report:', error);
      throw error;
    }
  }

  /**
   * Genera un reporte de calificaciones
   */
  async generateGradesReport(studentId, periodId) {
    try {
      const response = await api.post('/reports/generate', {
        category: 'grades',
        student_id: studentId,
        academic_period_id: periodId,
      });
      return response;
    } catch (error) {
      console.error('Error generating grades report:', error);
      throw error;
    }
  }
}

export default new PDFService();