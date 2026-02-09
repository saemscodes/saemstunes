import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SEOHead from '@/components/seo/SEOHead';
import { ProgressDashboard } from '@/components/dashboard/ProgressDashboard';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout, Award, Settings, History } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <MainLayout>
            <SEOHead
                title="Dashboard | Saem's Tunes"
                description="Track your music learning progress, view achievements, and plan your practice sessions."
            />

            <div className="space-y-8 pb-32">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight text-white">Your Studio</h1>
                    <p className="text-gray-500 font-medium uppercase tracking-[0.2em] text-[10px]">Learning Hub & Analytics</p>
                </div>

                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-white/5 border-white/10 p-1 h-12 rounded-2xl">
                        <TabsTrigger value="overview" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-white">
                            <Layout className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="achievements" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-white">
                            <Award className="h-4 w-4 mr-2" />
                            Achievements
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-white">
                            <History className="h-4 w-4 mr-2" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="outline-none">
                        <ProgressDashboard />
                    </TabsContent>

                    <TabsContent value="achievements">
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
                            <Award className="h-10 w-10 text-gold/20 mb-4" />
                            <p className="text-gray-500 font-medium italic">Achievements coming soon to your trophy case.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
                            <History className="h-10 w-10 text-gold/20 mb-4" />
                            <p className="text-gray-500 font-medium italic">Study history and session logs will appear here.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
};

export default Dashboard;
