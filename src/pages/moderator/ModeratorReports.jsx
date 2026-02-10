import React, { useState, useEffect } from 'react';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, PieChart as PieIcon, Users, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { toast } from "sonner";

export default function ModeratorReports() {
  const { getActiveToken } = useMultiAuth();
  const { t } = useLanguage();
  const token = getActiveToken('moderator');
  const [loading, setLoading] = useState(true);

  // Stats State
  const [dealStats, setDealStats] = useState([]);
  const [traderGrowth, setTraderGrowth] = useState([]);
  const [topEmployees, setTopEmployees] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Trades for Growth & Employee Stats
      const tradersRes = await api.get('/admin/traders', { headers: { Authorization: `Bearer ${token}` }});
      const traders = tradersRes.data?.data || [];
      
      // Calculate Employee Rankings
      const employeeCounts = {};
      traders.forEach(t => {
        if (t.employee) {
            employeeCounts[t.employee.name] = (employeeCounts[t.employee.name] || 0) + 1;
        }
      });
      const topEmp = Object.entries(employeeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopEmployees(topEmp);

      // Calculate Trader Growth (Last 7 days mock-ish logic or actual date parsing)
      // For real data, we'd group `createdAt`
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const growthData = last7Days.map(date => {
        return {
            date,
            count: traders.filter(t => t.createdAt && t.createdAt.startsWith(date)).length
        };
      });
      setTraderGrowth(growthData);

      // 2. Fetch Deals for Status Pie
      // If /admin/deals endpoint exists and moderator has access
      // If not, we might need to skip or use a different source. 
      // Assuming access exists based on routes.
      try {
        const dealsRes = await api.get('/admin/deals', { headers: { Authorization: `Bearer ${token}` }});
        const deals = dealsRes.data?.data || [];
        
        const statusCounts = {};
        deals.forEach(d => {
            statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
        });
        const pData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        setDealStats(pData);
      } catch (e) {
        console.warn("Could not fetch deals for report", e);
        setDealStats([]);
      }

    } catch (error) {
      console.error("Error fetching report data", error);
      toast.error(t('moderator.reports.loadFailed') || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('moderator.reports.title') || 'Platform Reports'}</h1>
        <p className="text-muted-foreground">{t('moderator.reports.subtitle') || 'Analytics and performance metrics'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Deal Status Distribution */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-indigo-500" />
                    {t('moderator.reports.dealStatus') || 'Deal Status Distribution'}
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                {dealStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dealStats}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {dealStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        No deal data available
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Trader Registration Growth */}
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    {t('moderator.reports.traderGrowth') || 'New Trader Registrations (7 Days)'}
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={traderGrowth}>
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Top Performing Employees */}
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    {t('moderator.reports.topEmployees') || 'Top Employees by Trader Assignment'}
                </CardTitle>
                <CardDescription>
                    {t('moderator.reports.topEmployeesDesc') || 'Employees managing the highest number of traders.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topEmployees.map((emp, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                    {index + 1}
                                </div>
                                <span className="font-medium text-gray-900">{emp.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-gray-900">{emp.count}</span>
                                <span className="text-gray-500 text-sm">{t('moderator.common.traders') || 'Traders'}</span>
                            </div>
                        </div>
                    ))}
                    {topEmployees.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No employee data available.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
