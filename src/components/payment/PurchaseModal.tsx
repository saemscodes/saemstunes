import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, CreditCard, Check, Smartphone, Award } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    const [phoneNumber, setPhoneNumber] = useState('');

    const handlePurchase = () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            toast.error("Please enter a valid M-Pesa phone number");
            return;
        }

        initiatePurchase.mutate({
            items: [{ type: item.type, id: item.id }],
            totalAmount: item.price,
            phoneNumber
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
                }, 3000);
            }
        });
    };

    const handleClose = () => {
        setStep('summary');
        setPhoneNumber('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[450px] bg-[#0A0B0C] border-white/5 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-6 z-10">
                    <button onClick={handleClose} className="p-2 rounded-full bg-white/5 text-gray-500 hover:text-white transition-colors">
                        <Loader2 className={cn("h-4 w-4", initiatePurchase.isPending && "animate-spin")} />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto w-24 h-24 rounded-[2rem] bg-gold/10 flex items-center justify-center shadow-inner">
                            {step === 'success' ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                    <Check className="h-10 w-10 text-emerald-500" />
                                </motion.div>
                            ) : (
                                <motion.div animate={{ rotate: step === 'processing' ? 360 : 0 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                    <Lock className="h-10 w-10 text-gold" />
                                </motion.div>
                            )}
                        </div>
                        <div className="text-center space-y-2">
                            <DialogTitle className="text-3xl font-black text-white tracking-tighter">
                                {step === 'success' ? 'Mastery Unlocked' : 'Unlock Your Potential'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-500 text-sm font-medium">
                                {step === 'summary' && `Join thousands of students learning "${item.title}"`}
                                {step === 'processing' && "Check your phone for the M-Pesa Prompt"}
                                {step === 'success' && "Your journey towards musical excellence continues now."}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {step === 'summary' && (
                        <div className="space-y-8">
                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-gold mb-1">{item.type} ACCESS</p>
                                        <h4 className="text-xl font-bold text-white leading-tight">{item.title}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-white">KES {item.price.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ONE-TIME PASS</p>
                                    </div>
                                </div>
                                {item.description && (
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-sm text-gray-400 italic">"{item.description}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-4">M-Pesa Phone Number</label>
                                <div className="relative group">
                                    <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors" />
                                    <input
                                        type="tel"
                                        placeholder="07XX XXX XXX"
                                        className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl pl-16 pr-6 text-white font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all text-lg"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                    <span>Encrypted STK Push Transaction</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 bg-gold rounded-full blur-3xl"
                                />
                                <div className="relative w-24 h-24 rounded-full bg-gold/10 border-4 border-gold/20 border-t-gold animate-spin flex items-center justify-center shadow-2xl">
                                    <Smartphone className="h-8 w-8 text-gold" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-white font-bold">Awaiting Transaction PIN</p>
                                <p className="text-xs text-gray-500">Please enter your M-Pesa PIN on your phone to complete the purchase.</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 text-center space-y-6">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]"
                            >
                                <Award className="h-4 w-4" />
                                Payment Verified
                            </motion.div>
                            <div className="space-y-2">
                                <p className="text-gray-400 text-sm font-medium">Wait a second, we're preparing your curriculum assets...</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        {step === 'summary' && (
                            <Button
                                onClick={handlePurchase}
                                className="w-full h-16 bg-gold hover:bg-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-gold/20 group"
                                disabled={initiatePurchase.isPending}
                            >
                                {initiatePurchase.isPending ? (
                                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                ) : (
                                    <CreditCard className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                                )}
                                Unlock Access
                            </Button>
                        )}
                        {step === 'success' && (
                            <Button
                                onClick={handleClose}
                                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20"
                            >
                                Enter Learning Hub
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PurchaseModal;
