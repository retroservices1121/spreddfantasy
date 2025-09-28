// src/app/page.tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Trophy,
  ArrowRight,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';

export default function HomePage() {
  const { user, authenticated, login } = useAuth();

  const features = [
    {
      icon: Trophy,
      title: 'Fantasy Leagues',
      description: 'Join prediction leagues and compete against other players',
      color: 'text-primary-500'
    },
    {
      icon: Zap,
      title: 'Real Markets',
      description: 'Predict on real-world events synced from Kalshi',
      color: 'text-blue-500'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'USDC payments on Base blockchain for low fees',
      color: 'text-green-500'
    },
    {
      icon: BarChart3,
      title: 'Live Analytics',
      description: 'Track your performance and climb the leaderboards',
      color: 'text-purple-500'
    }
  ];

  const stats = [
    { label: 'Active Players', value: '847', icon: Users },
    { label: 'Total Leagues', value: '156', icon: Trophy },
    { label: 'Prize Pool', value: '$12.4K', icon: DollarSign },
    { label: 'Markets', value: '89', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Fantasy
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
              {" "}Prediction{" "}
            </span>
            Markets
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Join fantasy leagues, predict real-world events, and win USDC prizes. 
            The future of prediction markets is here.
          </p>
          
          {authenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                size="lg"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-lg px-8 py-4"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                onClick={() => window.location.href = '/leagues'}
                size="lg"
                variant="outline"
                className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10 text-lg px-8 py-4"
              >
                Browse Leagues
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={login}
                size="lg"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-lg px-8 py-4"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                onClick={() => window.location.href = '#features'}
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4"
              >
                Learn More
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
              <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Choose SpreadMarkets?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the next generation of prediction markets with fantasy-style gameplay
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700 hover:border-primary-500/50 transition-all duration-300">
              <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get started in minutes with our simple 4-step process
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: 1, title: 'Connect Wallet', description: 'Sign in with social media or connect your crypto wallet' },
            { step: 2, title: 'Join League', description: 'Choose from daily, weekly, or monthly prediction leagues' },
            { step: 3, title: 'Make Predictions', description: 'Select markets and make your predictions on real events' },
            { step: 4, title: 'Win Prizes', description: 'Earn points for correct predictions and win USDC prizes' },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 text-center bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-primary-500/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Predicting?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of players already earning USDC through prediction markets
          </p>
          {authenticated ? (
            <Button 
              onClick={() => window.location.href = '/leagues'}
              size="lg"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-lg px-8 py-4"
            >
              Browse Active Leagues
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          ) : (
            <Button 
              onClick={login}
              size="lg"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-lg px-8 py-4"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
        </Card>
      </section>
    </div>
  );
}
