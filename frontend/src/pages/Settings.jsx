import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'react-toastify';
import { 
  FaCog, FaBell, FaShieldAlt, FaPalette, FaLanguage, 
  FaQuestionCircle, FaBook, FaWallet, FaToggleOn, FaToggleOff 
} from 'react-icons/fa';
import Card from '../components/Card';
import Button from '../components/Button';
import './Settings.css';

const Settings = () => {
  const { account, connected, disconnect } = useWallet();
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      proposalUpdates: true,
      votingReminders: true,
      treasuryAlerts: true,
      newProposals: true,
      emailNotifications: false,
      pushNotifications: true
    },
    privacy: {
      showProfile: true,
      showVotingHistory: true,
      showProposals: true,
      allowAnalytics: true
    },
    appearance: {
      theme: 'dark',
      accentColor: 'purple',
      compactMode: false,
      animations: true
    },
    language: 'en',
    currency: 'APT'
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('aptocom_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
  }, []);

  const handleSaveSettings = () => {
    setSaving(true);
    try {
      localStorage.setItem('aptocom_settings', JSON.stringify(settings));
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const handleToggle = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleSelectChange = (category, key, value) => {
    if (category) {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      const defaultSettings = {
        notifications: {
          proposalUpdates: true,
          votingReminders: true,
          treasuryAlerts: true,
          newProposals: true,
          emailNotifications: false,
          pushNotifications: true
        },
        privacy: {
          showProfile: true,
          showVotingHistory: true,
          showProposals: true,
          allowAnalytics: true
        },
        appearance: {
          theme: 'dark',
          accentColor: 'purple',
          compactMode: false,
          animations: true
        },
        language: 'en',
        currency: 'APT'
      };
      setSettings(defaultSettings);
      localStorage.setItem('aptocom_settings', JSON.stringify(defaultSettings));
      toast.success('Settings reset to defaults');
    }
  };

  const handleDisconnectWallet = async () => {
    if (window.confirm('Are you sure you want to disconnect your wallet?')) {
      try {
        await disconnect();
        toast.success('Wallet disconnected successfully');
      } catch (err) {
        toast.error('Failed to disconnect wallet');
      }
    }
  };

  return (
    <div className="settings page">
      <div className="page-header">
        <h1><FaCog /> Settings</h1>
        <p className="subtitle">
          Customize your AptoCom experience, manage notifications, and configure preferences.
        </p>
      </div>

      {/* Wallet Settings */}
      <Card variant="outlined">
        <div className="settings-section">
          <div className="settings-section-header">
            <FaWallet />
            <h2>Wallet Connection</h2>
          </div>
          <div className="settings-section-content">
            {connected ? (
              <div className="wallet-info">
                <div className="wallet-info-item">
                  <span className="label">Connected Wallet:</span>
                  <span className="value">{account?.address}</span>
                </div>
                <div className="wallet-info-item">
                  <span className="label">Status:</span>
                  <span className="value status-connected">✓ Connected</span>
                </div>
                <Button variant="danger" size="small" onClick={handleDisconnectWallet}>
                  Disconnect Wallet
                </Button>
              </div>
            ) : (
              <div className="wallet-info">
                <p style={{ color: 'var(--text-secondary)' }}>No wallet connected</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Use the "Connect Wallet" button in the navigation bar to connect your Petra or Martian wallet.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card variant="default">
        <div className="settings-section">
          <div className="settings-section-header">
            <FaBell />
            <h2>Notifications</h2>
          </div>
          <div className="settings-section-content">
            <div className="settings-group">
              <SettingToggle
                label="Proposal Updates"
                description="Get notified when proposals you voted on are updated"
                checked={settings.notifications.proposalUpdates}
                onChange={() => handleToggle('notifications', 'proposalUpdates')}
              />
              <SettingToggle
                label="Voting Reminders"
                description="Remind me about active proposals before voting ends"
                checked={settings.notifications.votingReminders}
                onChange={() => handleToggle('notifications', 'votingReminders')}
              />
              <SettingToggle
                label="Treasury Alerts"
                description="Notify me about dividend distributions and treasury changes"
                checked={settings.notifications.treasuryAlerts}
                onChange={() => handleToggle('notifications', 'treasuryAlerts')}
              />
              <SettingToggle
                label="New Proposals"
                description="Get notified when new proposals are submitted"
                checked={settings.notifications.newProposals}
                onChange={() => handleToggle('notifications', 'newProposals')}
              />
              <SettingToggle
                label="Email Notifications"
                description="Receive notification emails (requires email setup)"
                checked={settings.notifications.emailNotifications}
                onChange={() => handleToggle('notifications', 'emailNotifications')}
                disabled
              />
              <SettingToggle
                label="Push Notifications"
                description="Enable browser push notifications"
                checked={settings.notifications.pushNotifications}
                onChange={() => handleToggle('notifications', 'pushNotifications')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card variant="default">
        <div className="settings-section">
          <div className="settings-section-header">
            <FaShieldAlt />
            <h2>Privacy & Security</h2>
          </div>
          <div className="settings-section-content">
            <div className="settings-group">
              <SettingToggle
                label="Public Profile"
                description="Allow others to view your profile and statistics"
                checked={settings.privacy.showProfile}
                onChange={() => handleToggle('privacy', 'showProfile')}
              />
              <SettingToggle
                label="Show Voting History"
                description="Display your voting history on your profile"
                checked={settings.privacy.showVotingHistory}
                onChange={() => handleToggle('privacy', 'showVotingHistory')}
              />
              <SettingToggle
                label="Show Proposals"
                description="Display proposals you've created on your profile"
                checked={settings.privacy.showProposals}
                onChange={() => handleToggle('privacy', 'showProposals')}
              />
              <SettingToggle
                label="Analytics"
                description="Help improve AptoCom by allowing anonymous usage data collection"
                checked={settings.privacy.allowAnalytics}
                onChange={() => handleToggle('privacy', 'allowAnalytics')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card variant="default">
        <div className="settings-section">
          <div className="settings-section-header">
            <FaPalette />
            <h2>Appearance</h2>
          </div>
          <div className="settings-section-content">
            <div className="settings-group">
              <SettingSelect
                label="Theme"
                description="Choose your preferred color theme"
                value={settings.appearance.theme}
                onChange={(value) => handleSelectChange('appearance', 'theme', value)}
                options={[
                  { value: 'dark', label: 'Dark (Current)' },
                  { value: 'light', label: 'Light (Coming Soon)' },
                  { value: 'auto', label: 'Auto (Coming Soon)' }
                ]}
              />
              <SettingSelect
                label="Accent Color"
                description="Choose your preferred accent color"
                value={settings.appearance.accentColor}
                onChange={(value) => handleSelectChange('appearance', 'accentColor', value)}
                options={[
                  { value: 'purple', label: 'Purple' },
                  { value: 'green', label: 'Green' },
                  { value: 'cyan', label: 'Cyan' },
                  { value: 'yellow', label: 'Yellow' }
                ]}
              />
              <SettingToggle
                label="Compact Mode"
                description="Reduce spacing and padding for a more compact layout"
                checked={settings.appearance.compactMode}
                onChange={() => handleToggle('appearance', 'compactMode')}
              />
              <SettingToggle
                label="Animations"
                description="Enable smooth transitions and animations"
                checked={settings.appearance.animations}
                onChange={() => handleToggle('appearance', 'animations')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Language & Region */}
      <Card variant="default">
        <div className="settings-section">
          <div className="settings-section-header">
            <FaLanguage />
            <h2>Language & Region</h2>
          </div>
          <div className="settings-section-content">
            <div className="settings-group">
              <SettingSelect
                label="Language"
                description="Choose your preferred language"
                value={settings.language}
                onChange={(value) => handleSelectChange(null, 'language', value)}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español (Coming Soon)' },
                  { value: 'fr', label: 'Français (Coming Soon)' },
                  { value: 'zh', label: '中文 (Coming Soon)' }
                ]}
              />
              <SettingSelect
                label="Currency Display"
                description="Choose how to display currency amounts"
                value={settings.currency}
                onChange={(value) => handleSelectChange(null, 'currency', value)}
                options={[
                  { value: 'APT', label: 'APT (Aptos Coin)' },
                  { value: 'USD', label: 'USD (Coming Soon)' },
                  { value: 'EUR', label: 'EUR (Coming Soon)' }
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Help & Support */}
      <Card variant="outlined">
        <div className="settings-section">
          <div className="settings-section-header">
            <FaQuestionCircle />
            <h2>Help & Support</h2>
          </div>
          <div className="settings-section-content">
            <div className="help-links">
              <a href="#" className="help-link">
                <FaBook /> Documentation
              </a>
              <a href="#" className="help-link">
                <FaQuestionCircle /> FAQs
              </a>
              <a href="https://github.com/RiyaGithub123/Aptocom" target="_blank" rel="noopener noreferrer" className="help-link">
                <FaBook /> GitHub Repository
              </a>
            </div>
            <div className="app-version">
              <span>AptoCom v1.0.0</span>
              <span>•</span>
              <span>Aptos Testnet</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="settings-actions">
        <Button variant="primary" onClick={handleSaveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
        <Button variant="ghost" onClick={handleResetSettings}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

// Helper Components
const SettingToggle = ({ label, description, checked, onChange, disabled }) => (
  <div className="setting-item">
    <div className="setting-item-content">
      <div className="setting-item-label">{label}</div>
      <div className="setting-item-description">{description}</div>
    </div>
    <button 
      className={`toggle-button ${checked ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onChange}
      disabled={disabled}
    >
      {checked ? <FaToggleOn /> : <FaToggleOff />}
    </button>
  </div>
);

const SettingSelect = ({ label, description, value, onChange, options }) => (
  <div className="setting-item">
    <div className="setting-item-content">
      <div className="setting-item-label">{label}</div>
      <div className="setting-item-description">{description}</div>
    </div>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="setting-select"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default Settings;
