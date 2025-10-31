"use client";
import { useState } from 'react';

interface HederaAccountModalProps {
  isOpen: boolean;
  evmAddress: string;
  onSubmit: (accountId: string) => void;
  onCancel: () => void;
}

export function HederaAccountModal({ isOpen, evmAddress, onSubmit, onCancel }: HederaAccountModalProps) {
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate Hedera account ID format
    if (!accountId.match(/^0\.0\.\d+$/)) {
      setError('Invalid format. Expected: 0.0.12345');
      return;
    }

    onSubmit(accountId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Enter Your Hedera Account ID
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Your wallet connected with an Ethereum-style address:
          </p>
          <code className="block px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm break-all font-mono text-gray-800 dark:text-gray-200">
            {evmAddress}
          </code>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          To use AfriArt, please enter your Hedera Account ID. You can find this in your wallet
          (e.g., HashPack, Blade) under your account details.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hedera Account ID
            </label>
            <input
              type="text"
              id="accountId"
              placeholder="0.0.12345"
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                setError('');
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                ${error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                }
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500`}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Format: 0.0.xxxxx (shard.realm.number)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg
                transition-colors font-medium"
            >
              Continue
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <details className="text-xs text-gray-600 dark:text-gray-400">
            <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
              Where do I find my Hedera Account ID?
            </summary>
            <div className="mt-2 space-y-2">
              <p><strong>HashPack:</strong> Open wallet → Settings → Your account ID is displayed at the top</p>
              <p><strong>Blade:</strong> Open wallet → Click on your profile → Account ID is shown</p>
              <p><strong>Hedera Portal:</strong> Log in to portal.hedera.com → Your account ID is displayed</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
