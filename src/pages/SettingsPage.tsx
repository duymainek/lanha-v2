import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Select } from '../components/Select';

type SettingsSection = 'general' | 'profile' | 'payment';

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dummy submit handlers
  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('General settings saved (simulated).');
  }
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile settings updated (simulated).');
  }
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Payment settings saved (simulated).');
  }


  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <Card title="General Settings">
            <form className="space-y-4" onSubmit={handleGeneralSubmit}>
              <Input label="Application Name" defaultValue="Là Nhà Apartment" />
              <Select label="Language" options={[{value: 'en', label: 'English'}, {value: 'vi', label: 'Tiếng Việt'}]} defaultValue="vi" />
              <Select label="Timezone" options={[{value: 'GMT+7', label: '(GMT+07:00) Bangkok, Hanoi, Jakarta'}]} />
              <Button type="submit">Save General Settings</Button>
            </form>
          </Card>
        );
      case 'profile':
        return (
          <Card title="Admin Profile">
            <form className="space-y-4" onSubmit={handleProfileSubmit}>
              <Input label="Full Name" defaultValue={user?.name} />
              <Input label="Email Address" type="email" defaultValue={user?.email} disabled />
              <Input label="Current Password" type="password" />
              <Input label="New Password" type="password" />
              <Input label="Confirm New Password" type="password" />
              <div className="flex justify-between items-center">
                <Button type="submit">Update Profile</Button>
                <Button type="button" variant="danger" onClick={handleLogout}>Logout</Button>
              </div>
            </form>
          </Card>
        );
      case 'payment':
        return (
          <Card title="Payment Methods">
            <p className="text-text-muted mb-4">Configure accepted payment methods for tenants.</p>
            <form className="space-y-4" onSubmit={handlePaymentSubmit}>
              <Input label="Bank Name" defaultValue="Vietcombank" />
              <Input label="Account Holder Name" defaultValue="CONG TY TNHH LA NHA" />
              <Input label="Account Number" defaultValue="007100xxxxxxx" />
              <Input label="Bank Branch" defaultValue="TP. Ho Chi Minh" />
              <p className="text-sm text-text-muted">Payment Instructions (e.g., transfer memo format):</p>
              <textarea className="w-full border border-border-color rounded-md p-2 focus:outline-none focus:ring-primary focus:border-primary" rows={3} defaultValue="[Room Number] - [Tenant Name] - Monthly Rent"></textarea>
              <Button type="submit">Save Payment Settings</Button>
            </form>
          </Card>
        );
      default:
        return null;
    }
  };

  const settingsNavItems: Array<{id: SettingsSection, name: string}> = [
    { id: 'general', name: 'General' },
    { id: 'profile', name: 'Profile' },
    { id: 'payment', name: 'Payment Methods' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold text-text-main">Settings</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4">
          <Card className="p-0">
            <nav className="space-y-1 p-2" aria-label="Settings sections">
              {settingsNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left
                    ${activeSection === item.id
                      ? 'bg-primary-light text-primary'
                      : 'text-text-main hover:bg-slate-100 hover:text-text-main'
                    }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </Card>
        </div>
        <div className="w-full md:w-3/4">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};