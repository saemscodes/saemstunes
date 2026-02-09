import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, CreditCard, Check, Smartphone } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: {
        id: string;
        title: string;
        type: 'course' | 'module' | 'class' | 'lesson';
        price: number;
        description?: string;
    };
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, item }) => {
    const { initiatePurchase, confirmPurchase } = usePayment();
    const [step, setStep] = useState<'summary' | 'processing' | 'success'>('summary');

    const handlePurchase = () => {
        initiatePurchase.mutate({
            items: [{ type: item.type, id: item.id }],
            totalAmount: item.price
        }, {
            onSuccess: (data) => {
                setStep('processing');
                // Simulate payment gateway delay then confirm
                setTimeout(() => {
                    confirmPurchase.mutate(data.id, {
                        onSuccess: () => {
                            setStep('success');
                        }
                    });
                }, 2000);
            }
        });
    };

    const handleClose = () => {
        setStep('summary');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto bg-amber-100 p-3 rounded-full w-fit mb-4">
                        {step === 'success' ? (
                            <Check className="h-6 w-6 text-green-600" />
                        ) : (
                            <Lock className="h-6 w-6 text-amber-600" />
                        )}
                    </div>
                    <DialogTitle className="text-center">
                        {step === 'success' ? 'Purchase Successful!' : 'Unlock Content'}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {step === 'summary' && `You are about to purchase "${item.title}".`}
                        {step === 'processing' && "Processing your M-Pesa payment..."}
                        {step === 'success' && "You now have full access to this content."}
                    </DialogDescription>
                </DialogHeader>

                {step === 'summary' && (
                    <div className="py-4 space-y-4">
                        <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{item.title}</p>
                                <p className="text-xs text-muted-foreground uppercase">{item.type}</p>
                            </div>
                            <p className="text-lg font-bold text-gold">KES {item.price.toLocaleString()}</p>
                        </div>
                        {item.description && (
                            <p className="text-sm text-muted-foreground italic">"{item.description}"</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-50 p-2 rounded border border-amber-100">
                            <Smartphone className="h-3 w-3" />
                            <span>Standard M-Pesa STK Push will be initiated.</span>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-gold" />
                        <p className="text-sm">Waiting for payment confirmation...</p>
                    </div>
                )}

                <DialogFooter>
                    {step === 'summary' && (
                        <Button onClick={handlePurchase} className="w-full bg-gold hover:bg-gold-dark text-white" disabled={initiatePurchase.isPending}>
                            {initiatePurchase.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                            Confirm Purchase
                        </Button>
                    )}
                    {step === 'success' && (
                        <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700 text-white">
                            Start Learning
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PurchaseModal;
