import React from 'react';
import { useUserProgress } from '@/hooks/useUserProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Target, Clock, BookOpen, Music, Play, ChevronRight, Award, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ProgressDashboard: React.FC = () => {
    const { useProgressStats, useAchievements, useProgress } = useUserProgress();
    const { data: stats, isLoading: statsLoading } = useProgressStats();
    const { data: achievements } = useAchievements();
    const { data: recentProgress } = useProgress();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    if (statsLoading) {
        return <div className="animate-pulse space-y-8">
            <div className="h-48 bg-white/5 rounded-[3rem]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-white/5 rounded-[2rem]" />
                <div className="h-32 bg-white/5 rounded-[2rem]" />
                <div className="h-32 bg-white/5 rounded-[2rem]" />
            </div>
        </div>;
    }

    const nextUp = recentProgress?.find(p => p.status === 'in_progress' || p.status === 'started');

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Premium Hero Overview */}
            <div className="relative overflow-hidden p-10 rounded-[3.5rem] bg-[#121417] border border-white/5 shadow-2xl">
                {/* Background Glows */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 blur-[80px] rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold uppercase tracking-widest">
                            <Zap className="h-3 w-3" />
                            Daily Motivation
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter text-white">
                            Keep going, <span className="text-gold">{user?.name?.split(' ')[0] || 'Musician'}</span>!
                        </h2>
                        <p className="text-gray-400 font-medium max-w-md">
                            You've mastered <span className="text-white font-bold">{stats?.totalLessonsCompleted || 0} lessons</span> so far. Consistency is the key to musical mastery.
                        </p>
                    </div>

                    <div className="flex gap-6">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="flex flex-col items-center p-6 bg-white/5 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 min-w-[140px] shadow-xl"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-3">
                                <Flame className="h-6 w-6 text-orange-500" />
                            </div>
                            <p className="text-4xl font-black text-white">{stats?.currentStreak || 0}</p>
                            <p className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mt-1">Day Streak</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="flex flex-col items-center p-6 bg-white/5 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 min-w-[140px] shadow-xl"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center mb-3">
                                <Trophy className="h-6 w-6 text-gold" />
                            </div>
                            <p className="text-4xl font-black text-white">{stats?.totalLessonsCompleted || 0}</p>
                            <p className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mt-1">Milestones</p>
                        </motion.div>
                    </div>
                </div>

                {/* Visual Accent */}
                <Music className="absolute -bottom-16 -right-16 h-80 w-80 text-white/[0.02] -rotate-12 pointer-events-none" />
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-[#121417] border-white/5 rounded-[3rem] overflow-hidden group hover:border-gold/30 transition-all duration-500 shadow-xl">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all duration-500">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Level Progression</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-4xl font-black text-white">{stats?.activeCourses || 0}</p>
                                <p className="text-sm text-gray-400 font-medium">Active courses enrolled</p>
                            </div>
                            <Progress value={Math.min((stats?.totalLessonsCompleted || 0) * 5, 100)} className="h-1.5 bg-white/5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#121417] border-white/5 rounded-[3rem] overflow-hidden group hover:border-blue-500/30 transition-all duration-500 shadow-xl">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                <Clock className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Focus Hours</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-4xl font-black text-white">{(stats?.totalTimeSpentMinutes || 0 / 60).toFixed(1)}h</p>
                                <p className="text-sm text-gray-400 font-medium">Total dedicated focus time</p>
                            </div>
                            <Progress value={65} className="h-1.5 bg-white/5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#121417] border-white/5 rounded-[3rem] overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 shadow-xl">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                                <Award className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Trophies</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-4xl font-black text-white">{achievements?.length || 0}</p>
                                <p className="text-sm text-gray-400 font-medium">Badges earned in-app</p>
                            </div>
                            <Progress value={Math.min((achievements?.length || 0) * 10, 100)} className="h-1.5 bg-white/5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Activity Chart */}
            <Card className="bg-[#121417] border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <Target className="h-5 w-5 text-gold" />
                            Practice Activity
                        </h3>
                        <p className="text-gray-500 text-sm font-medium">Your learning consistency over the last 7 days.</p>
                    </div>
                    <div className="flex gap-3">
                        <Badge className="bg-gold/10 text-gold border-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Growth +12%</Badge>
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Active Week</Badge>
                    </div>
                </div>

                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            { day: 'Mon', minutes: 45 },
                            { day: 'Tue', minutes: 52 },
                            { day: 'Wed', minutes: 38 },
                            { day: 'Thu', minutes: 65 },
                            { day: 'Fri', minutes: 48 },
                            { day: 'Sat', minutes: 75 },
                            { day: 'Sun', minutes: 60 },
                        ]}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1C1F23',
                                    border: '1px solid rgba(255,215,0,0.1)',
                                    borderRadius: '1rem',
                                    fontSize: '12px',
                                    color: '#fff'
                                }}
                                cursor={{ fill: 'rgba(255,215,0,0.05)' }}
                            />
                            <Bar
                                dataKey="minutes"
                                fill="url(#barGradient)"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                                animationDuration={1500}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Smart Feed & Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <Play className="h-5 w-5 text-gold" fill="currentColor" />
                            Continue Learning
                        </h3>
                        <Button variant="ghost" size="sm" className="text-gold font-bold p-0 hover:bg-transparent" onClick={() => navigate('/learning-hub')}>
                            View Hub <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {nextUp ? (
                            <motion.div
                                whileHover={{ x: 5 }}
                                onClick={() => navigate(`/lesson/${nextUp.entity_id}`)}
                                className="flex items-center justify-between p-6 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all group cursor-pointer shadow-lg"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-all">
                                        <Music className="h-8 w-8 text-gold" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white mb-1">Resume your lesson</p>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-gold/10 text-gold border-none text-[8px] font-black">{nextUp.entity_type.toUpperCase()}</Badge>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">In Progress</p>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-6 w-6 text-gray-700 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        ) : (
                            <div className="p-10 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                                <BookOpen className="h-10 w-10 text-gray-700 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium italic">No active lessons. Ready to start something new?</p>
                                <Button className="mt-6 rounded-xl bg-gold hover:bg-amber-600 text-white" onClick={() => navigate('/learning-hub')}>
                                    Browse Courses
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <Target className="h-5 w-5 text-gold" />
                        Daily Quest
                    </h3>
                    <Card className="bg-[#121417] border-white/5 rounded-[3.5rem] p-10 space-y-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center">
                                <span className="text-xs font-black text-gold">75%</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">30 Min Practice</p>
                                <p className="text-xs font-black text-gold">{stats?.toolSessionsThisWeek || 0} / 5 sessions</p>
                            </div>
                            <Progress value={Math.min(((stats?.toolSessionsThisWeek || 0) / 5) * 100, 100)} className="h-2 bg-white/5" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Weekly Lessons</p>
                                <p className="text-xs font-black text-gold">{stats?.totalLessonsCompleted || 0} / 10</p>
                            </div>
                            <Progress value={Math.min(((stats?.totalLessonsCompleted || 0) / 10) * 100, 100)} className="h-2 bg-white/5" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Global Rank</p>
                                <p className="text-xs font-black text-emerald-500">TOP 15%</p>
                            </div>
                            <Progress value={85} className="h-2 bg-white/5" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
