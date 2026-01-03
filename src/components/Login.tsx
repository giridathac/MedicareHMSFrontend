import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { apiRequest } from '../api/base';
import { Activity } from 'lucide-react';

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      username: string;
      role: string;
    };
  };
}

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

   

    try {

      const response = await apiRequest<LoginResponse>(`/auth/login?username=${encodeURIComponent(username.trim())}&password=${encodeURIComponent(password)}`, {
        method: 'GET',
      });

      // Assuming the API returns a token or user data on success
      console.log('Login successful:', response);
      console.log('Response keys:', Object.keys(response));
      console.log('Response data token field:', response.data?.token);

      // Store token only - role will be extracted from token in App.tsx
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        
      } else {
        console.warn('No token found in login response data');
      }

       
      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Activity className="size-8 text-blue-600 flex-shrink-0" />
          <div>
            <h1 className="text-gray-900">MediCare HMS</h1>
            <p className="text-sm text-gray-500">Hospital Management</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-blue-100">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-900">MediCare HMS Login</CardTitle>
            <p className="text-gray-500">Please enter your credentials to continue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col items-center space-y-4">
              <div className="border border-gray-300 rounded-md p-4 w-full max-w-xs">
                <div className="space-y-2">
                  <Label htmlFor="username">UserName</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full"
                  />
                </div>
                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !username.trim() || !password}
                >
                  {loading ? 'Logging in...' : 'LOGIN'}
                </Button>
              </div>
            </form>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Forgot Password?
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
