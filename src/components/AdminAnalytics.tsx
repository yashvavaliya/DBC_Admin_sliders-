import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Eye, 
  Calendar,
  Activity,
  UserCheck,
  Globe,
  Smartphone,
  Download
} from 'lucide-react';

interface Analytics {
  totalUsers: number;
  totalCards: number;
  activeUsers: number;
  publishedCards: number;
  totalViews: number;
  newUsersThisMonth: number;
  userGrowthData: Array<{ month: string; users: number }>;
}

interface AdminAnalyticsProps {
  analytics: Analytics;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ analytics }) => {
  const growthPercentage = analytics.userGrowthData.length >= 2 
    ? ((analytics.userGrowthData[analytics.userGrowthData.length - 1]?.users || 0) - 
       (analytics.userGrowthData[analytics.userGrowthData.length - 2]?.users || 0)) / 
       Math.max(analytics.userGrowthData[analytics.userGrowthData.length - 2]?.users || 1, 1) * 100
    : 0;

  const cardPublishRate = analytics.totalCards > 0 
    ? (analytics.publishedCards / analytics.totalCards * 100).toFixed(1)
    : 0;

  const avgViewsPerCard = analytics.totalCards > 0 
    ? (analytics.totalViews / analytics.totalCards).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
        <p className="text-gray-600">Comprehensive insights into platform usage and performance</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}% from last month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cards</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalCards}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600">{cardPublishRate}% published</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalViews}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-purple-600">{avgViewsPerCard} avg per card</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.newUsersThisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-600">New registrations</span>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Trend</h3>
          <div className="h-64 bg-gray-50 rounded-lg p-4">
            <div className="h-full flex items-end justify-between gap-2">
              {analytics.userGrowthData.map((data, index) => {
                const maxUsers = Math.max(...analytics.userGrowthData.map(d => d.users));
                const height = maxUsers > 0 ? (data.users / maxUsers) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t-md min-h-[4px] transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${data.month}: ${data.users} users`}
                    />
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      <div className="font-medium">{data.users}</div>
                      <div className="text-gray-400">{data.month}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Web Platform</p>
                  <p className="text-sm text-gray-600">Desktop & Mobile Web</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">100%</p>
                <p className="text-xs text-gray-500">of traffic</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Mobile Optimized</p>
                  <p className="text-sm text-gray-600">Responsive Design</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">✓</p>
                <p className="text-xs text-gray-500">enabled</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Engagement Rate</p>
                  <p className="text-sm text-gray-600">Card interactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{cardPublishRate}%</p>
                <p className="text-xs text-gray-500">publish rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">User Engagement</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="font-medium text-gray-900">{analytics.activeUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cards Created</span>
              <span className="font-medium text-gray-900">{analytics.totalCards}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Published Cards</span>
              <span className="font-medium text-gray-900">{analytics.publishedCards}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Draft Cards</span>
              <span className="font-medium text-gray-900">{analytics.totalCards - analytics.publishedCards}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Content Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Views</span>
              <span className="font-medium text-gray-900">{analytics.totalViews}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Views/Card</span>
              <span className="font-medium text-gray-900">{avgViewsPerCard}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Publish Rate</span>
              <span className="font-medium text-gray-900">{cardPublishRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cards/User</span>
              <span className="font-medium text-gray-900">
                {analytics.totalUsers > 0 ? (analytics.totalCards / analytics.totalUsers).toFixed(1) : '0'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Growth Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Users (Month)</span>
              <span className="font-medium text-gray-900">{analytics.newUsersThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Growth Rate</span>
              <span className={`font-medium ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Retention Rate</span>
              <span className="font-medium text-gray-900">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="font-medium text-gray-900">{cardPublishRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Growth Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Monthly User Growth</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            Last 6 months
          </div>
        </div>
        
        <div className="h-80 bg-gray-50 rounded-lg p-6">
          <div className="h-full flex items-end justify-between gap-4">
            {analytics.userGrowthData.map((data, index) => {
              const maxUsers = Math.max(...analytics.userGrowthData.map(d => d.users));
              const height = maxUsers > 0 ? (data.users / maxUsers) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg min-h-[8px] transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-500 cursor-pointer"
                      style={{ height: `${Math.max(height, 8)}%` }}
                      title={`${data.month}: ${data.users} users`}
                    />
                    {/* Hover tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.users} users
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="font-semibold text-gray-900 text-lg">{data.users}</div>
                    <div className="text-xs text-gray-500 font-medium">{data.month}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Strong Growth</span>
              </div>
              <p className="text-sm text-green-700">
                User registration is trending upward with {analytics.newUsersThisMonth} new users this month.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">High Engagement</span>
              </div>
              <p className="text-sm text-blue-700">
                {cardPublishRate}% of created cards are published, showing good user engagement.
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Good Visibility</span>
              </div>
              <p className="text-sm text-purple-700">
                Cards are getting an average of {avgViewsPerCard} views each.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Export All Data</p>
                  <p className="text-sm text-gray-600">Download complete analytics report</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Generate Report</p>
                  <p className="text-sm text-gray-600">Create monthly performance report</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">User Insights</p>
                  <p className="text-sm text-gray-600">Analyze user behavior patterns</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};