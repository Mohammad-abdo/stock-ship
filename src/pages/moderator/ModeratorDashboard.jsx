import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  BarChart2, 
  Bell,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Shield,
  Building2,
  User
} from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ModeratorDashboard() {
  const { auths, logout, getActiveToken } = useMultiAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const user = auths.moderator?.user;
  const token = getActiveToken('moderator');

  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    reports: 0
  });
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const tradersRes = await api.get('/admin/traders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allTraders = tradersRes.data?.data || [];
      const pending = allTraders.filter(t => !t.isVerified);
      const active = allTraders.filter(t => t.isVerified);
      
      setTraders(pending);
      
      const employeesRes = await api.get('/admin/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(employeesRes.data?.data || []);

      setStats({
        pending: pending.length,
        active: active.length,
        reports: 0 
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (traderId) => {
    try {
      await api.put(`/traders/${traderId}`, { isVerified: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Trader verified successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to verify trader");
    }
  };
  
  const handleAssignClick = (trader) => {
    setSelectedTrader(trader);
    setSelectedEmployee(trader.employeeId || "");
    setIsAssignOpen(true);
  };

  const submitAssignment = async () => {
    if (!selectedEmployee) return;
    
    try {
      setAssignLoading(true);
      await api.put(`/traders/${selectedTrader.id}/assign`, { 
        employeeId: selectedEmployee 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Employee assigned successfully");
      setIsAssignOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to assign employee");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-linear-to-br from-amber-500 to-orange-600 border-none shadow-lg">
           <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm font-medium text-amber-100">{t('moderator.dashboard.pendingApprovals') || 'Pending Approvals'}</p>
                    <h3 className="text-3xl font-bold text-white mt-2">{stats.pending}</h3>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                 </div>
              </div>
           </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-emerald-500 to-teal-600 border-none shadow-lg">
           <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm font-medium text-emerald-100">{t('moderator.dashboard.activeTraders') || 'Active Traders'}</p>
                    <h3 className="text-3xl font-bold text-white mt-2">{stats.active}</h3>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                 </div>
              </div>
           </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-blue-500 to-indigo-600 border-none shadow-lg">
           <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm font-medium text-blue-100">{t('moderator.dashboard.reportsToday') || 'Reports Today'}</p>
                    <h3 className="text-3xl font-bold text-white mt-2">{stats.reports}</h3>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Recent Registrations Table */}
      <Card className="border-gray-200/60 shadow-md overflow-hidden backdrop-blur-sm bg-white/90">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            {t('moderator.dashboard.recentRegistrations') || 'Recent Trader Registrations'}
          </CardTitle>
          <CardDescription className="text-gray-500">
            {t('moderator.dashboard.reviewTraders') || 'Review and approve new trader accounts.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : traders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">{t('moderator.dashboard.noPendingRegistrations') || 'No pending trader registrations.'}</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold">{t('moderator.traders.traderName') || 'Trader Name'}</th>
                    <th scope="col" className="px-6 py-4 font-semibold">{t('moderator.common.email') || 'Email'}</th>
                    <th scope="col" className="px-6 py-4 font-semibold">{t('moderator.common.phone') || 'Phone'}</th>
                    <th scope="col" className="px-6 py-4 font-semibold">{t('moderator.common.status') || 'Status'}</th>
                    <th scope="col" className="px-6 py-4 font-semibold">{t('moderator.traders.assignedTo') || 'Assigned To'}</th>
                    <th scope="col" className="px-6 py-4 text-right font-semibold">{t('moderator.common.action') || 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {traders.map((trader) => (
                    <tr key={trader.id} className="bg-white hover:bg-indigo-50/30 transition-colors duration-150">
                      <th scope="row" className="px-6 py-4">
                        <div className="font-medium text-gray-900">{trader.name}</div>
                        <div className="text-xs text-indigo-500 font-medium flex items-center gap-1 mt-0.5">
                           <Building2 className="w-3 h-3" />
                           {trader.companyName}
                        </div>
                      </th>
                      <td className="px-6 py-4 text-gray-600">{trader.email}</td>
                      <td className="px-6 py-4 text-gray-600">{trader.phone}</td>
                      <td className="px-6 py-4">
                        <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t('moderator.status.pending') || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {trader.employee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                              {trader.employee.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {trader.employee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic flex items-center gap-1">
                             <User className="w-3 h-3" />
                             {t('moderator.common.unassigned') || 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex gap-2 justify-end">
                            <Button 
                               size="sm" 
                               variant="outline" 
                               onClick={() => handleAssignClick(trader)} 
                               className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                            >
                              {trader.employee ? (t('common.reassign') || 'Reassign') : (t('common.assign') || 'Assign')}
                            </Button>
                            <Button 
                               size="sm" 
                               onClick={() => handleApprove(trader.id)} 
                               className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t('common.approve') || 'Approve'}
                            </Button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Assignment Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employee</DialogTitle>
            <DialogDescription>
              Assign a dedicated employee to manage {selectedTrader?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Employee</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedEmployee ? selectedEmployee.toString() : ""} 
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="" disabled>Select an employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button onClick={submitAssignment} disabled={assignLoading || !selectedEmployee}>
              {assignLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign Employee
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
