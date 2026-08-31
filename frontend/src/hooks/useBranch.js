// FILE: frontend/src/hooks/useBranch.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/axiosClient';
import { useAuth } from './useAuth';

export const useBranch = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/branches');
      const data = response.data || [];
      setBranches(data);

      if (user?.branch_id) {
        const userBranch = data.find(b => b.id === user.branch_id);
        if (userBranch) {
          setCurrentBranch(userBranch);
          localStorage.setItem('currentBranch', JSON.stringify(userBranch));
        }
      } else {
        const savedBranch = localStorage.getItem('currentBranch');
        if (savedBranch) {
          try {
            const parsed = JSON.parse(savedBranch);
            const exists = data.some(b => b.id === parsed.id);
            if (exists) {
              setCurrentBranch(parsed);
            } else {
              setCurrentBranch(data[0] || null);
            }
          } catch {
            setCurrentBranch(data[0] || null);
          }
        } else {
          setCurrentBranch(data[0] || null);
        }
      }
    } catch (err) {
      setError(err.message || 'Error al cargar sucursales');
      console.error('Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const switchBranch = useCallback((branchId) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      localStorage.setItem('currentBranch', JSON.stringify(branch));
      return true;
    }
    return false;
  }, [branches]);

  const getBranch = useCallback((id) => {
    return branches.find(b => b.id === id) || null;
  }, [branches]);

  const hasBranchAccess = useCallback((branchId) => {
    if (!user) return false;
    if (user.roles?.includes('SUPER_ADMIN')) return true;
    if (user.branch_id === branchId) return true;
    return user.branches?.includes(branchId) || false;
  }, [user]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  return {
    branches,
    currentBranch,
    loading,
    error,
    loadBranches,
    switchBranch,
    getBranch,
    hasBranchAccess,
  };
};