// src/app/admin/page.tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useAdmin } from '@/lib/hooks/useAdmin';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { Card } from '@/components/ui/card';
import { AlertCircle, Shield } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
          <p className="text-gray-400">Please sign in to access the admin panel</p>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access the admin panel</p>
        </Card>
      </div>
    );
  }

  return <AdminDashboard />;
}
