import React, { useState, useEffect } from 'react';
import { Settings, Upload, Save, Moon, Sun } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { ThemeColors } from '../types';
import toast from 'react-hot-toast';

const DEFAULT_THEME: ThemeColors = {
  primary: '#2563eb',
  secondary: '#1e40af',
  accent: '#3b82f6',
  background: '#f3f4f6',
  sidebar: '#111827',
};

export default function DashboardSettings() {
  const { dashboardSettings, updateDashboardSettings, isDarkMode, toggleDarkMode } = useAppState();
  const [settings, setSettings] = useState({
    name: dashboardSettings?.name || '',
    logoUrl: dashboardSettings?.logoUrl || '',
    theme: { ...DEFAULT_THEME, ...dashboardSettings?.theme },
    darkMode: isDarkMode
  });
  const [colorErrors, setColorErrors] = useState<Record<string, string>>({});
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  useEffect(() => {
    if (dashboardSettings) {
      setSettings({
        ...dashboardSettings,
        theme: { ...DEFAULT_THEME, ...dashboardSettings.theme },
        darkMode: isDarkMode
      });
      applyThemeColors(dashboardSettings.theme);
    }
  }, [dashboardSettings, isDarkMode]);

  const applyThemeColors = (theme: ThemeColors) => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      if (validateHexColor(value)) {
        root.style.setProperty(`--color-${key}`, value);
      }
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewLogo(base64String);
        setSettings(prev => ({ ...prev, logoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateHexColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6})$/.test(color);
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    // Always update the color value for immediate feedback
    const newTheme = {
      ...settings.theme,
      [key]: value.toUpperCase()
    };
    
    setSettings(prev => ({
      ...prev,
      theme: newTheme
    }));

    // Validate and show/clear errors
    if (value.length === 7) {
      if (validateHexColor(value)) {
        setColorErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
        applyThemeColors(newTheme);
      } else {
        setColorErrors(prev => ({
          ...prev,
          [key]: 'Invalid hex color format'
        }));
      }
    }
  };

  const handleColorInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      e.target.value = '#';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all colors
    const errors: Record<string, string> = {};
    Object.entries(settings.theme).forEach(([key, value]) => {
      if (!validateHexColor(value)) {
        errors[key] = 'Invalid hex color format';
      }
    });

    if (Object.keys(errors).length > 0) {
      setColorErrors(errors);
      toast.error('Please fix color format errors before saving');
      return;
    }

    try {
      await updateDashboardSettings(settings);
      applyThemeColors(settings.theme);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Dashboard Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">General Settings</h3>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dashboard Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo
              </label>
              <div className="flex items-center gap-4">
                {(previewLogo || settings.logoUrl) && (
                  <img
                    src={previewLogo || settings.logoUrl}
                    alt="Dashboard logo"
                    className="w-24 h-24 object-contain"
                  />
                )}
                <label className="cursor-pointer flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Theme Colors</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.theme).map(([key, value]) => (
              <div key={key} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={validateHexColor(value) ? value : '#000000'}
                    onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                    className="w-12 h-12 p-1 rounded border cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value.toUpperCase())}
                      onFocus={handleColorInputFocus}
                      maxLength={7}
                      className={`w-full p-2 border rounded-lg font-mono uppercase dark:bg-gray-600 dark:border-gray-500 dark:text-white ${
                        colorErrors[key] ? 'border-red-500' : ''
                      }`}
                      placeholder="#000000"
                    />
                    {colorErrors[key] && (
                      <p className="text-red-500 text-xs mt-1">{colorErrors[key]}</p>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <div 
                    className="w-full h-8 rounded"
                    style={{ backgroundColor: validateHexColor(value) ? value : '#000000' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium mb-4">Preview</h4>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full bg-primary text-white px-4 py-2 rounded"
              >
                Primary Button
              </button>
              <button
                type="button"
                className="w-full bg-secondary text-white px-4 py-2 rounded"
              >
                Secondary Button
              </button>
              <button
                type="button"
                className="w-full bg-accent text-white px-4 py-2 rounded"
              >
                Accent Button
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </form>
    </div>
  );
}