// FILE: backend/src/services/documents.service.js
const AppError = require('../utils/AppError');
const repository = require('../repositories/documents.repository');
const { generateCode } = require('../utils/codeGenerator');
const auditService = require('./audit.service');
const fs = require('fs');
const path = require('path');
const { pick } = require('../utils/pick');
// FIX (auditoria hallazgo C1 - aislamiento por sede)
const { scopeFiltersToUserBranches, assertBranchAccess } = require('../utils/branchScope');

// FIX (auditoria hallazgo #5 - mass assignment): whitelist explícita de
// columnas reales de la tabla que el cliente puede escribir. Cualquier
// otro campo del body se ignora en vez de llegar crudo al INSERT/UPDATE.
const ALLOWED_FIELDS = ['student_id', 'document_type', 'title', 'file_path', 'file_name', 'file_size', 'mime_type', 'status', 'upload_date'];

// NOTA DE SEGURIDAD: file_path es una ruta absoluta del servidor de archivos —
// nunca debe llegar al cliente (fuga de infraestructura interna). El archivo real
// solo se sirve a través de DocumentsService.download(), que lee el registro
// crudo directamente del repositorio, no de estos métodos ya saneados.
const sanitize = (record) => {
  if (!record) return record;
  const { file_path, ...safe } = record;
  return safe;
};
const sanitizeList = (records) => records.map(sanitize);

const DocumentsService = {
  async findAll(filters, user) {
    const { page = 1, pageSize = 20, search, studentId, documentType, status } = filters;
    // FIX (C1): solo documentos de estudiantes de las sedes del usuario.
    const queryFilters = scopeFiltersToUserBranches({ search, studentId, documentType, status }, user);
    const [data, total] = await Promise.all([
      repository.findAll({ ...queryFilters, page, pageSize }),
      repository.count(queryFilters),
    ]);
    return { data: sanitizeList(data), total, page: Number(page), pageSize: Number(pageSize) };
  },

  async findById(id, user) {
    const record = await repository.findById(id);
    assertBranchAccess(record, user, 'Document not found');
    return sanitize(record);
  },

  async create(payload, user) {
    const code = await generateCode('DOC');
    const data = {
      ...pick(payload, ALLOWED_FIELDS),
      code,
      status: payload.status || 'ACTIVE',
      created_by: user.id,
      updated_by: user.id
    };
    const [id] = await repository.create(data);
    const record = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'CREATE',
      module: 'documents',
      recordCode: code,
      after: record,
      req: null
    });
    
    return sanitize(record);
  },

  async upload(file, payload, user) {
    const code = await generateCode('DOC');
    const data = {
      ...pick(payload, ALLOWED_FIELDS),
      code,
      file_path: file.path,
      file_name: file.filename,
      file_size: file.size,
      mime_type: file.mimetype,
      upload_date: new Date(),
      status: 'ACTIVE',
      created_by: user.id,
      updated_by: user.id
    };
    const [id] = await repository.create(data);
    const record = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'UPLOAD',
      module: 'documents',
      recordCode: code,
      after: record,
      req: null
    });
    
    return sanitize(record);
  },

  async download(id, user) {
    const record = await repository.findById(id);
    // FIX (C1): sin esto, cualquier usuario con permiso de descarga podía
    // descargar el archivo de un estudiante de otra sede solo adivinando/
    // enumerando el id.
    assertBranchAccess(record, user, 'Document not found');
    
    const filePath = record.file_path;
    if (!fs.existsSync(filePath)) throw new AppError('File not found on server', 404);
    
    const stream = fs.createReadStream(filePath);
    return {
      stream,
      filename: record.file_name || 'document',
      mimeType: record.mime_type || 'application/octet-stream'
    };
  },

  async update(id, payload, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Document not found');
    
    const before = { ...existing };
    await repository.update(id, { ...pick(payload, ALLOWED_FIELDS), updated_by: user.id });
    const after = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'UPDATE',
      module: 'documents',
      recordCode: existing.code,
      before,
      after,
      req: null
    });
    
    return sanitize(after);
  },

  async softDelete(id, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Document not found');
    
    await repository.softDelete(id, user.id);
    
    await auditService.log({
      user,
      action: 'DELETE',
      module: 'documents',
      recordCode: existing.code,
      before: existing,
      req: null
    });
    
    return true;
  }
};

module.exports = DocumentsService;