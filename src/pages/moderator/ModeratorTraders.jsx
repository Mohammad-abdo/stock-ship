import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Users, Search, Filter, CheckCircle, Clock, 
  Building2, User, ArrowLeft, Loader2, Shield
} from "lucide-react";
import { toast } from "sonner";

export default function ModeratorTraders() {
  const { auths, getActiveToken } = useMultiAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const token = getActiveToken('moderator');

  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employees, setEmployees] = useState([]);
  
  // Assignment Modal State
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchTraders();
    fetchEmployees();
  }, [statusFilter]); // Refetch when filter changes

  // Debounce search could be added, for now simple search button or effect
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchTraders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTraders = async () => {
    try {
      setLoading(true);
      // Construct query params
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter); // 'verified', 'unverified'
      
      const response = await api.get(`/admin/traders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTraders(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching traders:", error);
      toast.error(t('moderator.traders.loadFailed') || "Failed to load traders");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/admin/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleApprove = async (traderId) => {
    try {
      await api.put(`/traders/${traderId}`, { isVerified: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('moderator.traders.verifiedSuccess') || "Trader verified successfully");
      fetchTraders();
    } catch (error) {
      toast.error(t('moderator.traders.verifyFailed') || "Failed to verify trader");
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
      
      toast.success(t('moderator.traders.assignSuccess') || "Employee assigned successfully");
      setIsAssignOpen(false);
      fetchTraders();
    } catch (error) {
      toast.error(error.response?.data?.message || t('moderator.traders.assignFailed') || "Failed to assign employee");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <Button variant="ghost" size="sm" className="-ml-3" onClick={() => navigate('/stockship/moderator/dashboard')}>
               <ArrowLeft className="w-4 h-4 mr-1" />
               {t('common.back') || 'Back'}
             </Button>
           </div>
           <h1 className="text-3xl font-bold text-gray-900">{t('moderator.traders.title') || 'Traders Management'}</h1>
           <p className="text-muted-foreground">{t('moderator.traders.subtitle') || 'Manage and assign traders'}</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm bg-white">
        <CardHeader className="border-b border-gray-100 pb-4">
           <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <Input 
                   placeholder={t('moderator.common.searchPlaceholder') || "Search by name, email, or code..."} 
                   className="pl-9"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                       <Filter className="w-4 h-4 mr-2 text-gray-400" />
                       <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">{t('moderator.filter.all') || 'All Status'}</SelectItem>
                       <SelectItem value="verified">{t('moderator.filter.verified') || 'Verified'}</SelectItem>
                       <SelectItem value="unverified">{t('moderator.filter.pending') || 'Pending'}</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : traders.length === 0 ? (
             <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">{t('moderator.traders.noTradersFound') || 'No traders found'}</h3>
                <p className="text-gray-500">{t('moderator.traders.tryAdjustingFilters') || 'Try adjusting your search or filters'}</p>
             </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t('moderator.traders.traderName') || 'Trader Name'}</th>
                    <th className="px-6 py-4 font-semibold">{t('moderator.common.contact') || 'Contact'}</th>
                    <th className="px-6 py-4 font-semibold">{t('moderator.common.status') || 'Status'}</th>
                    <th className="px-6 py-4 font-semibold">{t('moderator.traders.assignedTo') || 'Assigned To'}</th>
                    <th className="px-6 py-4 text-right font-semibold">{t('moderator.common.action') || 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {traders.map((trader) => (
                    <tr key={trader.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="font-medium text-gray-900">{trader.name}</div>
                         <div className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            {trader.companyName}
                         </div>
                         <div className="text-xs text-gray-400 font-mono mt-1">{trader.traderCode}</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-gray-600">{trader.email}</div>
                         <div className="text-gray-500 text-xs mt-0.5">{trader.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                         {trader.isVerified ? (
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                               <CheckCircle className="w-3 h-3" />
                               {t('moderator.status.verified') || 'Verified'}
                            </span>
                         ) : (
                            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
                               <Clock className="w-3 h-3" />
                               {t('moderator.status.pending') || 'Pending'}
                            </span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                        {trader.employee ? (
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                {trader.employee.name.charAt(0)}
                             </div>
                             <span className="text-gray-700">{trader.employee.name}</span>
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
                               className="h-8 text-xs"
                            >
                               {trader.employee ? (t('common.reassign') || 'Reassign') : (t('common.assign') || 'Assign')}
                            </Button>
                            {!trader.isVerified && (
                               <Button 
                                  size="sm" 
                                  onClick={() => handleApprove(trader.id)}
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                               >
                                  {t('common.approve') || 'Approve'}
                               </Button>
                            )}
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
            <DialogTitle>{t('moderator.assignment.title') || 'Assign Employee'}</DialogTitle>
            <DialogDescription>
              {t('moderator.assignment.description') || `Assign a dedicated employee to manage ${selectedTrader?.name}.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('moderator.assignment.selectEmployee') || 'Select Employee'}</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedEmployee ? selectedEmployee.toString() : ""} 
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="" disabled>{t('moderator.assignment.placeholder') || 'Select an employee'}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>{t('common.cancel') || 'Cancel'}</Button>
            <Button onClick={submitAssignment} disabled={assignLoading || !selectedEmployee}>
              {assignLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('moderator.assignment.confirm') || 'Assign Employee'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
