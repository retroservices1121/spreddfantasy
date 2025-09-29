// src/components/admin/MarketResolution.tsx
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X } from 'lucide-react';

export function MarketResolution() {
  return (
    <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
      <h3 className="text-lg font-semibold text-white mb-4">Market Resolution</h3>
      <p className="text-gray-400">Market resolution component - integrate with contract</p>
    </Card>
  );
}
