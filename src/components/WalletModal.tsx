import { useState, useEffect } from 'react';
import { X, Plus, Minus, History } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE_URL = 'https://www.niftybulks.com/api';

interface WalletTransaction {
  _id: string;
  type: 'add' | 'withdraw';
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const [activeTab, setActiveTab] = useState<'add' | 'withdraw' | 'history'>('add');
  const [amount, setAmount] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState('');
  const [walletActionLoading, setWalletActionLoading] = useState(false);
  const { updateUser } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const fetchWallet = async () => {
      setWalletLoading(true);
      setWalletError('');
      try {
        const token = localStorage.getItem('nifty-bulk-token');
        const response = await fetch(`${API_BASE_URL}/users/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch wallet');
        const data = await response.json();
        setWalletBalance(data.balance);
        setWalletTransactions(data.transactions);
      } catch (err) {
        setWalletError(err instanceof Error ? err.message : 'Failed to fetch wallet');
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, [isOpen]);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddFunds = async () => {
    const amountNum = parseFloat(amount);
    if (amountNum > 0) {
      setWalletActionLoading(true);
      setWalletError('');
      try {
        const token = localStorage.getItem('nifty-bulk-token');
        const response = await fetch(`${API_BASE_URL}/users/wallet/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: amountNum }),
        });
        if (!response.ok) throw new Error('Failed to add money');
        const data = await response.json();
        setWalletBalance(data.balance);
        setWalletTransactions((prev) => [data.transaction, ...prev]);
        updateUser({ walletBalance: data.balance });
      showToastMessage(`₹${amountNum} added to wallet successfully!`);
      setAmount('');
      } catch (err) {
        setWalletError(err instanceof Error ? err.message : 'Failed to add money');
      } finally {
        setWalletActionLoading(false);
      }
    }
  };

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (amountNum > 0 && amountNum <= walletBalance) {
      setWalletActionLoading(true);
      setWalletError('');
      try {
        const token = localStorage.getItem('nifty-bulk-token');
        const response = await fetch(`${API_BASE_URL}/users/wallet/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: amountNum }),
        });
        if (!response.ok) throw new Error('Failed to withdraw money');
        const data = await response.json();
        setWalletBalance(data.balance);
        setWalletTransactions((prev) => [data.transaction, ...prev]);
        updateUser({ walletBalance: data.balance });
      showToastMessage(`₹${amountNum} withdrawn successfully!`);
      setAmount('');
      } catch (err) {
        setWalletError(err instanceof Error ? err.message : 'Failed to withdraw money');
      } finally {
        setWalletActionLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200/50 dark:border-slate-700/50 rounded-3xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-slate-700/50">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Wallet</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all duration-300"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Current Balance</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">₹{walletBalance.toLocaleString()}</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-slate-700 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'add'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-1" />
              Add Funds
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'withdraw'
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600'
              }`}
            >
              <Minus className="h-4 w-4 inline mr-1" />
              Withdraw
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600'
              }`}
            >
              <History className="h-4 w-4 inline mr-1" />
              History
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="Enter amount"
                  disabled={walletActionLoading}
                />
              </div>
              <button
                onClick={handleAddFunds}
                disabled={!amount || parseFloat(amount) <= 0 || walletActionLoading}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg"
              >
                {walletActionLoading ? 'Processing...' : 'Simulate UPI Payment'}
              </button>
              {walletError && <div className="text-red-500 text-xs mt-1">{walletError}</div>}
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="Enter amount"
                  max={walletBalance}
                  disabled={walletActionLoading}
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance || walletActionLoading}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg"
              >
                {walletActionLoading ? 'Processing...' : 'Simulate Withdrawal'}
              </button>
              {walletError && <div className="text-red-500 text-xs mt-1">{walletError}</div>}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {walletLoading ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">Loading...</p>
              ) : walletTransactions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No transactions yet</p>
              ) : (
                walletTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.type === 'add' ? 'Added Funds' : 'Withdrawal'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-sm font-medium ${
                      transaction.type === 'add' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'add' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-green-200 dark:border-green-700 rounded-2xl px-6 py-4 shadow-xl z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 dark:text-green-400 font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletModal;