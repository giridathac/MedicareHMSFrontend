// Custom hook for token management logic
import { useState, useEffect, useCallback } from 'react';
import { tokensApi, CreateTokenDto, UpdateTokenStatusDto } from '../api';
import { Token, Doctor } from '../types';

export function useTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tokensData, doctorsData] = await Promise.all([
        tokensApi.getAll(),
        tokensApi.getDoctors(),
      ]);
      setTokens(tokensData);
      setDoctors(doctorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const createToken = useCallback(async (data: CreateTokenDto) => {
    try {
      setError(null);
      const newToken = await tokensApi.create(data);
      setTokens(prev => [...prev, newToken]);
      return newToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create token';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateTokenStatus = useCallback(async (data: UpdateTokenStatusDto) => {
    try {
      setError(null);
      const updatedToken = await tokensApi.updateStatus(data);
      setTokens(prev => prev.map(t => t.id === data.id ? updatedToken : t));
      return updatedToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update token status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getTokensByStatus = useCallback((status: Token['status']) => {
    return tokens.filter(t => t.status === status);
  }, [tokens]);

  return {
    tokens,
    doctors,
    loading,
    error,
    fetchTokens,
    createToken,
    updateTokenStatus,
    getTokensByStatus,
  };
}

