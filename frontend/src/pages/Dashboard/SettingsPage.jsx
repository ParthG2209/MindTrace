// src/pages/Dashboard/SettingsPage.jsx - GLASSMORPHISM UPDATED
import React, { useState } from 'react';
import { 
  Bell, Shield, Palette, Globe, Save, Moon, Sun
} from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    compactMode: false,
    emailNotifications: true,
    pushNotifications: false,
    sessionCompleted: true,
    weeklyReport: true,
    publicProfile: false,
    shareAnalytics: true,
    language: 'en',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all ${className}`}>
      {children}
    </div>
  );

  const Section = ({ title, description, icon: Icon, children }) => (
    <GlassCard>
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-blue-500/20 rounded-xl backdrop-blur-sm">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </GlassCard>
  );

  const SettingItem = ({ label, description, children }) => (
    <div className="flex items-center justify-between py-3 border-t border-white/10 first:border-t-0 first:pt-0">
      <div className="flex-1">
        <p className="text-white font-medium">{label}</p>
        {description && (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Settings</h1>
          <p className="text-gray-400">Manage your application preferences and account settings</p>
        </div>
        <button
          onClick={handleSave}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          <Save className="w-5 h-5" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      

      {/* Notifications */}
      <Section
        title="Notifications"
        description="Manage how you receive updates"
        icon={Bell}
      >
        <SettingItem
          label="Email Notifications"
          description="Receive updates via email"
        >
          <Toggle
            checked={settings.emailNotifications}
            onChange={(value) => setSettings({ ...settings, emailNotifications: value })}
          />
        </SettingItem>

        <SettingItem
          label="Push Notifications"
          description="Receive browser notifications"
        >
          <Toggle
            checked={settings.pushNotifications}
            onChange={(value) => setSettings({ ...settings, pushNotifications: value })}
          />
        </SettingItem>

        <SettingItem
          label="Session Completed"
          description="Get notified when evaluation completes"
        >
          <Toggle
            checked={settings.sessionCompleted}
            onChange={(value) => setSettings({ ...settings, sessionCompleted: value })}
          />
        </SettingItem>

        <SettingItem
          label="Weekly Report"
          description="Receive weekly performance summary"
        >
          <Toggle
            checked={settings.weeklyReport}
            onChange={(value) => setSettings({ ...settings, weeklyReport: value })}
          />
        </SettingItem>
      </Section>

      {/* Privacy & Security */}
      <Section
        title="Privacy & Security"
        description="Control your data and privacy"
        icon={Shield}
      >
        <SettingItem
          label="Public Profile"
          description="Make your profile visible to others"
        >
          <Toggle
            checked={settings.publicProfile}
            onChange={(value) => setSettings({ ...settings, publicProfile: value })}
          />
        </SettingItem>

        <SettingItem
          label="Share Analytics"
          description="Help improve MindTrace by sharing anonymous usage data"
        >
          <Toggle
            checked={settings.shareAnalytics}
            onChange={(value) => setSettings({ ...settings, shareAnalytics: value })}
          />
        </SettingItem>

        <SettingItem
          label="Two-Factor Authentication"
          description="Add an extra layer of security"
        >
          <button className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all text-sm backdrop-blur-sm">
            Enable 2FA
          </button>
        </SettingItem>
      </Section>

      {/* Language & Region */}
      <Section
        title="Language & Region"
        description="Set your preferred language and region"
        icon={Globe}
      >
        <SettingItem
          label="Language"
          description="Choose your display language"
        >
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
          </select>
        </SettingItem>

        <SettingItem
          label="Time Zone"
          description="Set your local time zone"
        >
          <select
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
          >
            <option>UTC (GMT+0:00)</option>
            <option>EST (GMT-5:00)</option>
            <option>PST (GMT-8:00)</option>
            <option>IST (GMT+5:30)</option>
            <option>JST (GMT+9:00)</option>
          </select>
        </SettingItem>
      </Section>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-2xl p-6 hover:bg-red-500/20 hover:border-red-500/30 transition-all">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-500/20 rounded-xl backdrop-blur-sm">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">Danger Zone</h3>
            <p className="text-sm text-gray-400">Irreversible actions for your account</p>
          </div>
        </div>
        <div className="space-y-3">
          <button className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-left backdrop-blur-sm">
            <p className="font-medium">Delete All Sessions</p>
            <p className="text-sm text-gray-400 mt-1">Permanently delete all your teaching sessions</p>
          </button>
          <button className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-left backdrop-blur-sm">
            <p className="font-medium">Delete Account</p>
            <p className="text-sm text-gray-400 mt-1">Permanently delete your account and all data</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;