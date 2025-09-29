// src/components/auth/WalletConnect.tsx
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Mail, Chrome } from 'lucide-react';

export function WalletConnect() {
  const { login, authenticated, user } = usePrivy();

  if (authenticated) {
    return (
      <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Connected!</h3>
          <p className="text-gray-400 text-sm mb-4">
            {user?.email?.address || user?.wallet?.address || 'Wallet connected'}
          </p>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Connect to Get Started</h3>
        <p className="text-gray-400">
          Sign in with your wallet or social account
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={login}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 py-6"
        >
          <Wallet className="w-5 h-5 mr-3" />
          Connect Wallet
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-dark-900 text-gray-400">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={login}
            variant="outline"
            className="border-dark-600 text-white hover:bg-dark-700 py-6"
          >
            <Mail className="w-5 h-5 mr-2" />
            Email
          </Button>
          <Button
            onClick={login}
            variant="outline"
            className="border-dark-600 text-white hover:bg-dark-700 py-6"
          >
            <Chrome className="w-5 h-5 mr-2" />
            Social
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-6">
        By connecting, you agree to our Terms of Service and Privacy Policy
      </p>
    </Card>
  );
}
