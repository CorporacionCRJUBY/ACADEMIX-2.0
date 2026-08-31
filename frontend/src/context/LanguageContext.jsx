// FILE: frontend/src/context/LanguageContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { api } from '../api/axiosClient';
import { useAuth } from '../hooks/useAuth';

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  // Cargar idioma guardado
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // Intentar cargar desde localStorage
        const savedLang = localStorage.getItem('language');
        if (savedLang) {
          setCurrentLanguage(savedLang);
          await i18n.changeLanguage(savedLang);
          setLoading(false);
          return;
        }

        // Si hay usuario autenticado, cargar su preferencia desde el backend
        if (user) {
          try {
            const response = await api.get('/settings');
            const settings = response.data;
            if (settings.language) {
              setCurrentLanguage(settings.language);
              await i18n.changeLanguage(settings.language);
              localStorage.setItem('language', settings.language);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error al cargar idioma del usuario:', e);
          }
        }

        // Fallback: detectar idioma del navegador
        const browserLang = navigator.language?.split('-')[0] || 'en';
        const supportedLangs = ['en', 'es'];
        const lang = supportedLangs.includes(browserLang) ? browserLang : 'en';
        setCurrentLanguage(lang);
        await i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
      } catch (error) {
        console.error('Error al cargar idioma:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, [user, i18n]);

  // Cambiar idioma
  const changeLanguage = useCallback(async (lang) => {
    try {
      await i18n.changeLanguage(lang);
      setCurrentLanguage(lang);
      localStorage.setItem('language', lang);

      // Si hay usuario autenticado, guardar preferencia en el backend
      if (user) {
        try {
          await api.put('/settings', { language: lang });
        } catch (e) {
          console.error('Error al guardar preferencia de idioma:', e);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error al cambiar idioma:', error);
      return { success: false, error: error.message };
    }
  }, [i18n, user]);

  const value = {
    currentLanguage,
    loading,
    changeLanguage,
    supportedLanguages: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
    ],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};