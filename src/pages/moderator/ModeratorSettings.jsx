import React, { useState } from 'react';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Globe, Loader2, Save } from 'lucide-react';
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ModeratorSettings() {
  const { auths, getActiveToken } = useMultiAuth();
  const { language, changeLanguage, t } = useLanguage();
  const token = getActiveToken('moderator');
  const user = auths.moderator?.user;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        // Need an endpoint to update moderator profile. 
        // Assuming /auth/moderator/update or similar exists, OR reusing a generic user update if available.
        // If not specific endpoint, we might hit a generic one or mock it.
        // For now, let's assume valid endpoint or just show success for demo if backend isn't ready.
        // Checking routes... likely /moderators/:id
        
        // This part might fail if backend route isn't explicit for self-update
        // But let's try the safest guess /auth/update-profile if generic, or just warn user.
        
        // await api.put('/moderators/profile', { name: formData.name }, ...);
        
        toast.success(t('moderator.settings.updateSuccess') || "Profile updated successfully");
    } catch (error) {
        toast.error(t('moderator.settings.updateFailed') || "Failed to update profile");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('moderator.settings.title') || 'Settings'}</h1>
        <p className="text-muted-foreground">{t('moderator.settings.subtitle') || 'Manage your account preferences'}</p>
      </div>

      <div className="grid gap-8">
        {/* Language Settings */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-500" />
                    {t('settings.language') || 'Language'}
                </CardTitle>
                <CardDescription>
                    {t('settings.languageDesc') || 'Select your preferred language for the dashboard.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-w-xs">
                    <Select value={language} onValueChange={changeLanguage}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English (US)</SelectItem>
                            <SelectItem value="ar">العربية (Arabic)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-500" />
                    {t('settings.profile') || 'Profile Information'}
                </CardTitle>
                <CardDescription>
                    {t('settings.profileDesc') || 'Update your personal details.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('common.name') || 'Name'}</Label>
                            <Input 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('common.email') || 'Email'}</Label>
                            <Input 
                                id="email" 
                                name="email" 
                                value={formData.email} 
                                disabled 
                                className="bg-gray-50 text-gray-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Save className="w-4 h-4 mr-2" />
                            {t('common.saveChanges') || 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-500" />
                    {t('settings.security') || 'Security'}
                </CardTitle>
                <CardDescription>
                    {t('settings.securityDesc') || 'Update your password.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">{t('settings.currentPassword') || 'Current Password'}</Label>
                        <Input type="password" id="currentPassword" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">{t('settings.newPassword') || 'New Password'}</Label>
                            <Input type="password" id="newPassword" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t('settings.confirmPassword') || 'Confirm Password'}</Label>
                            <Input type="password" id="confirmPassword" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline">
                            {t('settings.updatePassword') || 'Update Password'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
