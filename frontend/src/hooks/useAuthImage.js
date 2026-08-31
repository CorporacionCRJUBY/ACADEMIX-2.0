// FILE: frontend/src/hooks/useAuthImage.js
// Hook para mostrar imágenes/archivos protegidos (requieren el token de auth),
// ya que /uploads dejó de servirse como carpeta pública estática (ver
// backend/src/app.js). Descarga el archivo vía axios con el header
// Authorization y expone un object URL temporal para <img src={url} />.
import { useEffect, useState } from 'react';
import { api } from '../api/axiosClient';

export const useAuthImage = (url) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    if (!url) {
      setBlobUrl(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);

    api
      .getBlobUrl(url)
      .then((created) => {
        if (cancelled) {
          URL.revokeObjectURL(created);
          return;
        }
        objectUrl = created;
        setBlobUrl(created);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { blobUrl, loading, error };
};

export default useAuthImage;
