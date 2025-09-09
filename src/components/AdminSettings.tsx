import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Mail, 
  Database, 
  AlertTriangle, 
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Bell,
  Lock,
  BarChart3 // <-- Add this
} from 'lucide-react';

interface SystemSettings {
  maintenance_mode: boolean;
  email_notifications: boolean;
  auto_backup: boolean;
  max_cards_per_user: number;
  max_file_size_mb: number;
}

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    email_notifications: true,
    auto_backup: true,
    max_cards_per_user: 10,
    max_file_size_mb: 5
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('admin_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem('admin_settings', JSON.stringify(settings));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = (key: keyof SystemSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNumberChange = (key: keyof SystemSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
      } catch (error) {
        alert('Invalid settings file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onChange: () => void; 
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        
        <div className="flex gap-3">
          <input
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
            id="import-settings"
          />
          <label
            htmlFor="import-settings"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import
          </label>
          <button
            onClick={handleExportSettings}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Last Saved Indicator */}
      {lastSaved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              Settings saved successfully at {lastSaved.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          General Settings
        </h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Temporarily disable user access to the platform</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.maintenance_mode}
              onChange={() => handleToggleSetting('maintenance_mode')}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications for new user registrations</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.email_notifications}
              onChange={() => handleToggleSetting('email_notifications')}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Auto-backup</p>
                <p className="text-sm text-gray-500">Automatically backup user data daily</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.auto_backup}
              onChange={() => handleToggleSetting('auto_backup')}
            />
          </div>
        </div>
      </div>

      {/* Limits and Quotas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Limits & Quotas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Cards per User
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.max_cards_per_user}
              onChange={(e) => handleNumberChange('max_cards_per_user', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Limit how many business cards each user can create
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum File Size (MB)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.max_file_size_mb}
              onChange={(e) => handleNumberChange('max_file_size_mb', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum size for uploaded images and documents
            </p>
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Database className="w-5 h-5" />
          System Actions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 border border-blue-200 rounded-lg text-left hover:bg-blue-50 transition-colors">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-600">Backup Database</p>
                <p className="text-sm text-blue-500">Create a manual backup of all data</p>
              </div>
            </div>
          </button>

          <button className="p-4 border border-green-200 rounded-lg text-left hover:bg-green-50 transition-colors">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-600">Refresh Cache</p>
                <p className="text-sm text-green-500">Clear system cache and refresh data</p>
              </div>
            </div>
          </button>

          <button className="p-4 border border-purple-200 rounded-lg text-left hover:bg-purple-50 transition-colors">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-600">Send Notifications</p>
                <p className="text-sm text-purple-500">Send system updates to all users</p>
              </div>
            </div>
          </button>

          <button className="p-4 border border-orange-200 rounded-lg text-left hover:bg-orange-50 transition-colors">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-600">Generate Reports</p>
                <p className="text-sm text-orange-500">Create detailed analytics reports</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Clear All Analytics Data</p>
                <p className="text-sm text-red-500">Permanently delete all analytics and view data</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Reset All Settings</p>
                <p className="text-sm text-red-500">Reset all system settings to default values</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Emergency Shutdown</p>
                <p className="text-sm text-red-500">Immediately disable all user access</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Platform Version</span>
              <span className="text-sm font-medium text-gray-900">v2.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Database Status</span>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Storage Usage</span>
              <span className="text-sm font-medium text-gray-900">2.3 GB / 10 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm font-medium text-gray-900">2 hours ago</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Server Status</span>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-gray-900">99.9%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">API Requests (24h)</span>
              <span className="text-sm font-medium text-gray-900">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium text-green-600">0.1%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};