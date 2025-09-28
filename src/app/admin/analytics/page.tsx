// src/app/admin/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/lib/database/supabase';

interface AnalyticsData {
  revenue: Array<{ date: string; amount: number; }>;
  users: Array<{ date: string; count: number; }>;
  leagues: Array<{ type: string; count: number; revenue: number; }>;
  markets: Array<{ category: string; count: number; accuracy: number; }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      // This would typically come from your analytics API
      // For demo purposes, using mock data
      const mockData: AnalyticsData = {
        revenue: [
          { date: '2025-09-01', amount: 1250 },
          { date: '2025-09-08', amount: 1680 },
          { date: '2025-09-15', amount: 2100 },
          { date: '2025-09-22', amount: 2450 },
          { date: '2025-09-29', amount: 2890 },
        ],
        users: [
          { date: '2025-09-01', count: 45 },
          { date: '2025-09-08', count: 62 },
          { date: '2025-09-15', count: 89 },
          { date: '2025-09-22', count: 127 },
          { date: '2025-09-29', count: 156 },
        ],
        leagues: [
          { type: 'daily', count: 45, revenue: 2250 },
          { type: 'weekly', count: 12, revenue: 3600 },
          { type: 'monthly', count: 3, revenue: 1875 },
        ],
        markets: [
          { category: 'sports', count: 85, accuracy: 73.2 },
          { category: 'crypto', count: 42, accuracy: 68.1 },
          { category: 'politics', count: 28, accuracy: 81.4 },
          { category: 'entertainment', count: 15, accuracy: 65.8 },
        ],
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Implement CSV export functionality
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary-500" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Platform performance and user insights
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-dark-700 border border-dark-600 text-white rounded px-3 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            onClick={exportData}
            variant="outline"
            className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">$12,450</p>
              <p className="text-xs text-green-300">+18.5% this month</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-blue-400">847</p>
              <p className="text-xs text-blue-300">+12.3% this month</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Avg. Accuracy</p>
              <p className="text-2xl font-bold text-purple-400">72.1%</p>
              <p className="text-xs text-purple-300">+2.1% this month</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary-500/10 to-primary-600/10 border-primary-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Active Leagues</p>
              <p className="text-2xl font-bold text-primary-400">25</p>
              <p className="text-xs text-primary-300">+5 new this week</p>
            </div>
            <Calendar className="w-8 h-8 text-primary-400" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Line type="monotone" dataKey="amount" stroke="#ff6b35" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* User Growth Chart */}
        <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.users}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* League Performance */}
        <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <h3 className="text-lg font-semibold text-white mb-4">League Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.leagues}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="type" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="revenue" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Market Categories */}
        <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <h3 className="text-lg font-semibold text-white mb-4">Market Categories</h3>
          <div className="space-y-4">
            {analytics?.markets.map((market, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                  <span className="text-white capitalize">{market.category}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">{market.count} markets</span>
                  <span className="text-green-400">{market.accuracy}% accuracy</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Platform Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left text-gray-400 pb-3">Time</th>
                <th className="text-left text-gray-400 pb-3">User</th>
                <th className="text-left text-gray-400 pb-3">Action</th>
                <th className="text-left text-gray-400 pb-3">League</th>
                <th className="text-right text-gray-400 pb-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                { time: '2 min ago', user: 'alice.eth', action: 'Joined league', league: 'Weekend Warriors', amount: '$5.00' },
                { time: '5 min ago', user: 'bob.crypto', action: 'Won 1st place', league: 'Crypto Weekly', amount: '$60.00' },
                { time: '12 min ago', user: 'charlie.sports', action: 'Made prediction', league: 'Daily Quick', amount: '-' },
                { time: '18 min ago', user: 'diana.trader', action: 'Joined league', league: 'Monthly Masters', amount: '$25.00' },
                { time: '25 min ago', user: 'eve.predictions', action: 'Won 2nd place', league: 'Politics Weekly', amount: '$25.00' },
              ].map((activity, index) => (
                <tr key={index} className="border-b border-dark-700">
                  <td className="py-3 text-gray-400">{activity.time}</td>
                  <td className="py-3 text-white">{activity.user}</td>
                  <td className="py-3 text-white">{activity.action}</td>
                  <td className="py-3 text-primary-400">{activity.league}</td>
                  <td className="py-3 text-right text-green-400">{activity.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
