
import React from 'react';
import { X, CreditCard, Loader2, Crown, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading, Text } from './ui-components';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: () => void;
  isProcessing: boolean;
  isPremium?: boolean;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onPayment,
  isProcessing,
  isPremium = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div 
        className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <Heading.H3 className="flex items-center">
            Premium Upgrade
            <Crown className="ml-2 h-5 w-5 text-purple-500" />
          </Heading.H3>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isProcessing}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Diamond className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <Heading.H4 className="text-center mb-3 flex items-center justify-center">
            Get Unlimited Document Creation
            <Crown className="ml-2 h-4 w-4 text-purple-500" />
          </Heading.H4>
          
          <Text.Regular className="text-center mb-6">
            You've used your free document creation. Upgrade to our Premium Package for unlimited document creation, advanced formatting, and more.
          </Text.Regular>
          
          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 mb-6 border border-purple-100 dark:border-purple-800/30">
            <div className="flex justify-between items-center mb-2">
              <Text.Regular className="flex items-center">
                Premium Package
                <Diamond className="h-3.5 w-3.5 text-purple-500 ml-1.5" />
              </Text.Regular>
              <Text.Regular className="font-semibold">$14.00/month</Text.Regular>
            </div>
            <Text.Muted>Billed monthly, cancel anytime</Text.Muted>
          </div>
          
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            onClick={onPayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Subscribe Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
