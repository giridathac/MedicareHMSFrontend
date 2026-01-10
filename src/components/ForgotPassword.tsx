import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { apiRequest } from '../api/base';
import { Activity, ArrowLeft } from 'lucide-react';

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          EmailId: username.trim(),
          UserName: username.trim()
        }),
      });

      if (response.success) {
        setSuccess('Password reset instructions have been sent to your email.');
      } else {
        throw new Error(response.message || 'Failed to send reset instructions');
      }
    } catch (err) {
      console.error('Forgot password failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen bg-blue-100">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-900">Forgot Password</CardTitle>
            <p className="text-gray-500">Enter your username to reset your password</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="flex flex-col items-center space-y-4">
              <div className="border border-gray-300 rounded-md p-4 w-full max-w-xs">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
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
                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-green-600 text-sm text-center">
                    {success}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !username.trim()}
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                </Button>
              </div>
              <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
              >
                <ArrowLeft className="size-4" />
                Back to Login
              </button>
            </div>
            </form>

            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
