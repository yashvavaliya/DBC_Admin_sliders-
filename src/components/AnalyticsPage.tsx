import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Globe,
  MousePointer,
  Phone,
  Mail,
  QrCode,
  Calendar,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
  MapPin,
  ExternalLink,
  Star,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface AnalyticsData {
  totalViews: number;
  totalCards: number;
  publishedCards: number;
  draftCards: number;
  totalSocialClicks: number;
  totalContactActions: number;
  qrScans: number;
  viewsGrowth: number;
  topCards: Array<{
    id: string;
    title: string;
    views: number;
    clicks: number;
  }>;
  viewsOverTime: Array<{
    date: string;
    views: number;
  }>;
  socialClicksBreakdown: Array<{
    platform: string;
    clicks: number;
    color: string;
  }>;
  locationData: Array<{
    country: string;
    views: number;
  }>;
  contactActions: {
    phone: number;
    email: number;
    website: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    cardTitle: string;
    timestamp: string;
  }>;
  hourlyActivity: Array<{
    hour: number;
    views: number;
  }>;
}

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedCard, setSelectedCard] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'performance' | 'growth'>('overview');

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange, selectedCard]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Load user's cards
      const { data: cards, error: cardsError } = await supabase
        .from('business_cards')
        .select('id, title, view_count, is_published, created_at, updated_at')
        .eq('user_id', user.id)
        .order('view_count', { ascending: false });

      if (cardsError) throw cardsError;

      // Load analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('card_analytics')
        .select('*')
        .in('card_id', cards?.map(c => c.id) || [])
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString());

      if (analyticsError) throw analyticsError;

      // Process data
      const totalViews = cards?.reduce((sum, card) => sum + (card.view_count || 0), 0) || 0;
      const publishedCards = cards?.filter(card => card.is_published).length || 0;
      const draftCards = (cards?.length || 0) - publishedCards;

      // Generate mock data for demonstration (in production, this would come from real analytics)
      const mockAnalytics: AnalyticsData = {
        totalViews,
        totalCards: cards?.length || 0,
        publishedCards,
        draftCards,
        totalSocialClicks: Math.floor(totalViews * 0.3),
        totalContactActions: Math.floor(totalViews * 0.15),
        qrScans: Math.floor(totalViews * 0.6),
        viewsGrowth: Math.floor(Math.random() * 40) - 10, // -10 to +30
        topCards: cards?.slice(0, 5).map(card => ({
          id: card.id,
          title: card.title || 'Untitled Card',
          views: card.view_count || 0,
          clicks: Math.floor((card.view_count || 0) * 0.2)
        })) || [],
        viewsOverTime: generateTimeSeriesData(parseInt(dateRange)),
        socialClicksBreakdown: [
          { platform: 'LinkedIn', clicks: Math.floor(totalViews * 0.12), color: '#0A66C2' },
          { platform: 'Instagram', clicks: Math.floor(totalViews * 0.08), color: '#E1306C' },
          { platform: 'Twitter', clicks: Math.floor(totalViews * 0.05), color: '#1DA1F2' },
          { platform: 'Facebook', clicks: Math.floor(totalViews * 0.03), color: '#1877F3' },
          { platform: 'Website', clicks: Math.floor(totalViews * 0.02), color: '#6366F1' }
        ],
        locationData: [
          { country: 'United States', views: Math.floor(totalViews * 0.35) },
          { country: 'India', views: Math.floor(totalViews * 0.25) },
          { country: 'United Kingdom', views: Math.floor(totalViews * 0.15) },
          { country: 'Canada', views: Math.floor(totalViews * 0.10) },
          { country: 'Australia', views: Math.floor(totalViews * 0.08) },
          { country: 'Germany', views: Math.floor(totalViews * 0.07) }
        ],
        contactActions: {
          phone: Math.floor(totalViews * 0.08),
          email: Math.floor(totalViews * 0.05),
          website: Math.floor(totalViews * 0.02)
        },
        recentActivity: generateRecentActivity(cards || []),
        hourlyActivity: generateHourlyActivity()
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = (days: number) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50) + 10
      });
    }
    return data;
  };

  const generateRecentActivity = (cards: any[]) => {
    const activities = [];
    const actions = ['created', 'updated', 'published', 'viewed'];
    
    for (let i = 0; i < 10; i++) {
      const randomCard = cards[Math.floor(Math.random() * cards.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const date = new Date();
      date.setHours(date.getHours() - Math.floor(Math.random() * 48));
      
      activities.push({
        id: `activity-${i}`,
        action: randomAction,
        cardTitle: randomCard?.title || 'Untitled Card',
        timestamp: date.toISOString()
      });
    }
    
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const generateHourlyActivity = () => {
    const data = [];
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        hour,
        views: Math.floor(Math.random() * 20) + 5
      });
    }
    return data;
  };

  const exportData = () => {
    if (!analytics) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Views', analytics.totalViews],
      ['Total Cards', analytics.totalCards],
      ['Published Cards', analytics.publishedCards],
      ['Draft Cards', analytics.draftCards],
      ['Social Clicks', analytics.totalSocialClicks],
      ['Contact Actions', analytics.totalContactActions],
      ['QR Scans', analytics.qrScans]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Create and publish cards to see analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your digital business cards performance</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'engagement', label: 'Engagement', icon: MousePointer },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'growth', label: 'Growth', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.totalViews)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {analytics.viewsGrowth >= 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${analytics.viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(analytics.viewsGrowth)}% from last period
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">QR Scans</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.qrScans)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-purple-600">
                  {Math.round((analytics.qrScans / analytics.totalViews) * 100)}% of total views
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Social Clicks</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.totalSocialClicks)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">
                  {Math.round((analytics.totalSocialClicks / analytics.totalViews) * 100)}% engagement rate
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contact Actions</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.totalContactActions)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600">
                  {Math.round((analytics.totalContactActions / analytics.totalViews) * 100)}% conversion rate
                </span>
              </div>
            </div>
          </div>

          {/* Views Over Time Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Views Over Time</h3>
            <div className="h-64 bg-gray-50 rounded-lg p-4">
              <div className="h-full flex items-end justify-between gap-2">
                {analytics.viewsOverTime.map((data, index) => {
                  const maxViews = Math.max(...analytics.viewsOverTime.map(d => d.views));
                  const height = maxViews > 0 ? (data.views / maxViews) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t-md min-h-[4px] transition-all duration-300 hover:bg-blue-600"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${data.date}: ${data.views} views`}
                      />
                      <div className="mt-2 text-xs text-gray-600 text-center">
                        <div className="font-medium">{data.views}</div>
                        <div className="text-gray-400">{new Date(data.date).getDate()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Top Locations
            </h3>
            <div className="space-y-3">
              {analytics.locationData.map((location, index) => (
                <div key={location.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900">{location.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(location.views / analytics.locationData[0].views) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12 text-right">
                      {formatNumber(location.views)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          {/* Social Media Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Clicks</h3>
              <div className="space-y-4">
                {analytics.socialClicksBreakdown.map((social) => (
                  <div key={social.platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: social.color }}
                      />
                      <span className="font-medium text-gray-900">{social.platform}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: social.color,
                            width: `${(social.clicks / analytics.socialClicksBreakdown[0].clicks) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-12 text-right">
                        {formatNumber(social.clicks)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Actions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Phone Calls</p>
                      <p className="text-sm text-gray-500">Direct phone clicks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{analytics.contactActions.phone}</p>
                    <p className="text-xs text-gray-500">clicks</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-500">Email link clicks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{analytics.contactActions.email}</p>
                    <p className="text-xs text-gray-500">clicks</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Website</p>
                      <p className="text-sm text-gray-500">Website visits</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{analytics.contactActions.website}</p>
                    <p className="text-xs text-gray-500">visits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Activity Heatmap */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Activity by Hour
            </h3>
            <div className="grid grid-cols-12 gap-2">
              {analytics.hourlyActivity.map((data) => {
                const maxViews = Math.max(...analytics.hourlyActivity.map(d => d.views));
                const intensity = data.views / maxViews;
                
                return (
                  <div key={data.hour} className="text-center">
                    <div
                      className="w-full h-8 rounded mb-2 transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}
                      title={`${data.hour}:00 - ${data.views} views`}
                    />
                    <span className="text-xs text-gray-500">{data.hour}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Peak activity hours: {analytics.hourlyActivity
                .sort((a, b) => b.views - a.views)
                .slice(0, 3)
                .map(d => `${d.hour}:00`)
                .join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Card Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published Cards</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.publishedCards}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft Cards</p>
                  <p className="text-3xl font-bold text-orange-600">{analytics.draftCards}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cards</p>
                  <p className="text-3xl font-bold text-blue-600">{analytics.totalCards}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Top Performing Cards
            </h3>
            <div className="space-y-4">
              {analytics.topCards.map((card, index) => (
                <div key={card.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{card.title}</h4>
                      <p className="text-sm text-gray-500">{card.clicks} total interactions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{formatNumber(card.views)}</p>
                      <p className="text-xs text-gray-500">views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{formatNumber(card.clicks)}</p>
                      <p className="text-xs text-gray-500">clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {card.views > 0 ? Math.round((card.clicks / card.views) * 100) : 0}%
                      </p>
                      <p className="text-xs text-gray-500">CTR</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-900">Card Views</span>
                <div className="flex items-center gap-3">
                  <div className="w-64 bg-blue-200 rounded-full h-4">
                    <div className="bg-blue-600 h-4 rounded-full w-full" />
                  </div>
                  <span className="font-bold text-blue-600">{formatNumber(analytics.totalViews)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="font-medium text-gray-900">Social Clicks</span>
                <div className="flex items-center gap-3">
                  <div className="w-64 bg-green-200 rounded-full h-4">
                    <div 
                      className="bg-green-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${(analytics.totalSocialClicks / analytics.totalViews) * 100}%` }}
                    />
                  </div>
                  <span className="font-bold text-green-600">{formatNumber(analytics.totalSocialClicks)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <span className="font-medium text-gray-900">Contact Actions</span>
                <div className="flex items-center gap-3">
                  <div className="w-64 bg-orange-200 rounded-full h-4">
                    <div 
                      className="bg-orange-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${(analytics.totalContactActions / analytics.totalViews) * 100}%` }}
                    />
                  </div>
                  <span className="font-bold text-orange-600">{formatNumber(analytics.totalContactActions)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Growth Tab */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          {/* Recent Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Card <span className="font-medium">"{activity.cardTitle}"</span> was {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cards Created</span>
                  <span className="font-bold text-gray-900">{analytics.totalCards}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Publish Rate</span>
                  <span className="font-bold text-green-600">
                    {Math.round((analytics.publishedCards / analytics.totalCards) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Views per Card</span>
                  <span className="font-bold text-blue-600">
                    {Math.round(analytics.totalViews / analytics.totalCards)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Engagement Rate</span>
                  <span className="font-bold text-purple-600">
                    {Math.round((analytics.totalSocialClicks / analytics.totalViews) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm font-medium text-green-900">Strong Performance</p>
                  <p className="text-xs text-green-700">
                    Your cards are getting {Math.round(analytics.totalViews / analytics.totalCards)} views on average
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-blue-900">Good Engagement</p>
                  <p className="text-xs text-blue-700">
                    {Math.round((analytics.totalSocialClicks / analytics.totalViews) * 100)}% of viewers interact with your social links
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="text-sm font-medium text-purple-900">QR Code Usage</p>
                  <p className="text-xs text-purple-700">
                    {Math.round((analytics.qrScans / analytics.totalViews) * 100)}% of views come from QR code scans
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};