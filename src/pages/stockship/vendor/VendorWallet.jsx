import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { walletApi, vendorApi } from '@/lib/stockshipApi';
import { Wallet, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

const VendorWallet = () => {
  const { t } = useLanguage();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await walletApi.getVendorWallet();
      const data = response.data?.data || response.data;
      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await walletApi.getVendorTransactions();
      const data = response.data?.data || response.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleRequestPayout = async () => {
    const amount = prompt('Enter payout amount:');
    if (!amount || isNaN(amount)) return;
    try {
      await walletApi.requestPayout({ amount: parseFloat(amount) });
      alert('Payout request submitted successfully');
      fetchWallet();
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting payout');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
        <p className="text-muted-foreground">Manage your earnings and payouts</p>
      </div>

      {/* Wallet Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallet?.balance || 0} SAR</div>
            <p className="text-xs text-muted-foreground mt-1">Available for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallet?.totalEarnings || 0} SAR</div>
            <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallet?.totalCommission || 0} SAR</div>
            <p className="text-xs text-muted-foreground mt-1">Platform fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallet?.totalPayouts || 0} SAR</div>
            <p className="text-xs text-muted-foreground mt-1">Withdrawn amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Request */}
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold">{wallet?.balance || 0} SAR</p>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={!wallet?.balance || wallet.balance <= 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request Payout
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {transaction.type === 'CREDIT' || transaction.type === 'PAYOUT' ? (
                      <ArrowDownRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold">{transaction.description || transaction.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}{transaction.amount || 0} SAR
                    </p>
                    <p className="text-xs text-muted-foreground">Balance: {transaction.balanceAfter || 0} SAR</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorWallet;
