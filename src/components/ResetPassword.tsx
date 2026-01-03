import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { apiRequest } from '../api/base';
import { Activity } from 'lucide-react';

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendResetInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
    console.log('AAAAAAAAAAAAAAAA',JSON.stringify({ username: username.trim() }));
      const response = await apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim() }),
      });

      setSuccess(response.message || 'Reset instructions sent successfully. Please check your email.');
    } catch (err) {
      console.error('Forgot password failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reset instructions. Please try again.');
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-900">Reset Password</CardTitle>
            <p className="text-gray-500">Enter your username to receive reset instructions</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendResetInstructions} className="flex flex-col items-center space-y-4">
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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
