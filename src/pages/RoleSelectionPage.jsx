import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, TrendingUp, Ship, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLogo from '@/components/AppLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

const roles = [
  {
    key: 'admin',
    icon: Shield,
    path: '/admin/login',
    gradient: 'from-blue-500 to-blue-600',
    bgGlow: 'bg-blue-500/10',
    hoverBorder: 'hover:border-blue-500/40',
    iconBg: 'bg-blue-500/15 text-blue-600',
  },
  {
    key: 'employee',
    icon: Users,
    path: '/employee/login',
    gradient: 'from-emerald-500 to-emerald-600',
    bgGlow: 'bg-emerald-500/10',
    hoverBorder: 'hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/15 text-emerald-600',
  },
  {
    key: 'trader',
    icon: TrendingUp,
    path: '/trader/login',
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/10',
    hoverBorder: 'hover:border-amber-500/40',
    iconBg: 'bg-amber-500/15 text-amber-600',
  },
];

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const roleLabels = {
    admin: {
      title: language === 'ar' ? 'المدير' : 'Admin',
      description: language === 'ar'
        ? 'الوصول إلى لوحة التحكم الكاملة وإدارة النظام'
        : 'Access the full dashboard & manage the system',
      button: language === 'ar' ? 'تسجيل دخول كمدير' : 'Login as Admin',
    },
    employee: {
      title: language === 'ar' ? 'الموظف' : 'Employee',
      description: language === 'ar'
        ? 'إدارة التجار والصفقات والعمليات اليومية'
        : 'Manage traders, deals & day-to-day operations',
      button: language === 'ar' ? 'تسجيل دخول كموظف' : 'Login as Employee',
    },
    trader: {
      title: language === 'ar' ? 'التاجر' : 'Trader',
      description: language === 'ar'
        ? 'نشر العروض وإدارة الصفقات والمدفوعات'
        : 'Publish offers, manage deals & payments',
      button: language === 'ar' ? 'تسجيل دخول كتاجر' : 'Login as Trader',
    },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>

      {/* Header / Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 relative z-10"
      >
        <div className="mx-auto mb-5">
          <AppLogo imgClassName="max-h-16" showTagline />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
          {language === 'ar' ? 'مرحباً بك في StockShip' : 'Welcome to StockShip'}
        </h1>
        <p className="text-lg text-slate-400 max-w-md mx-auto">
          {language === 'ar'
            ? 'اختر دورك للدخول إلى لوحة التحكم'
            : 'Choose your role to access the dashboard'}
        </p>
      </motion.div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl relative z-10">
        {roles.map((role, idx) => {
          const Icon = role.icon;
          const labels = roleLabels[role.key];

          return (
            <motion.div
              key={role.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.15 }}
            >
              <Card
                className={`group relative cursor-pointer border border-slate-700/60 bg-slate-800/60 backdrop-blur-md shadow-xl transition-all duration-300 ${role.hoverBorder} hover:shadow-2xl hover:-translate-y-1`}
                onClick={() => navigate(role.path)}
              >
                {/* Top glow line */}
                <div className={`absolute inset-x-0 top-0 h-1 rounded-t-lg bg-linear-to-r ${role.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <CardHeader className="text-center pb-2 pt-8">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-16 h-16 mx-auto rounded-2xl ${role.iconBg} flex items-center justify-center mb-4 transition-colors`}
                  >
                    <Icon className="w-8 h-8" />
                  </motion.div>
                  <CardTitle className="text-xl font-bold text-white">
                    {labels.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-sm mt-1 min-h-[40px]">
                    {labels.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-8 pt-2">
                  <Button
                    className={`w-full bg-linear-to-r ${role.gradient} text-white font-semibold shadow-lg hover:shadow-xl transition-all gap-2`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(role.path);
                    }}
                  >
                    {labels.button}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-sm text-slate-500 relative z-10"
      >
        © {new Date().getFullYear()} StockShip.{' '}
        {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}
      </motion.p>
    </div>
  );
}
