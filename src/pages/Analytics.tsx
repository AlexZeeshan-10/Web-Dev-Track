import { useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from 'recharts';
import { Timer, CheckCircle2, Flame, Trophy, Download, Upload } from 'lucide-react';
import { format, subDays, startOfWeek, eachWeekOfInterval, subWeeks, isSameWeek } from 'date-fns';
import { toast } from 'sonner';

import { useData } from '@/lib/data-context';
import { MODULE_COLORS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Analytics() {
  const {
    lectures,
    studySessions,
    totalStudyHours,
    currentStreak,
    longestStreak,
    getCompletedCount,
    getModuleStats,
    exportData,
    importData,
  } = useData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wdj-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exported successfully!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = evt.target?.result as string;
        importData(json);
        toast.success('Data imported successfully!');
      } catch {
        toast.error('Failed to import data. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const moduleStats = getModuleStats().filter(m => m.total > 0);

  // 1. Weekly Progress Data (last 12 weeks)
  const weeklyData = useMemo(() => {
    const end = startOfWeek(new Date(), { weekStartsOn: 1 });
    const start = subWeeks(end, 11);
    
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    
    return weeks.map(weekStart => {
      const completedThisWeek = lectures.filter(l => {
        if (!l.completionDate) return false;
        return isSameWeek(new Date(l.completionDate), weekStart, { weekStartsOn: 1 });
      });
      
      return {
        name: format(weekStart, 'MMM d'),
        lectures: completedThisWeek.length,
      };
    });
  }, [lectures]);

  // 2. Heatmap Data (last 365 days)
  const heatmapWeeks = useMemo(() => {
    const today = new Date();
    const start = subDays(today, 364);
    
    // Create map of date string -> count
    const completionCounts = new Map<string, number>();
    lectures.forEach(l => {
      if (l.completionDate) {
        const dStr = l.completionDate.split('T')[0];
        completionCounts.set(dStr, (completionCounts.get(dStr) || 0) + 1);
      }
    });

    const cells: { date: Date, level: number, dateStr: string, count: number }[] = [];
    
    // Fill 365 days
    for (let i = 0; i < 365; i++) {
      const d = subDays(today, 364 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const count = completionCounts.get(dateStr) || 0;
      
      let level = 0;
      if (count > 0 && count <= 1) level = 1;
      else if (count > 1 && count <= 3) level = 2;
      else if (count > 3 && count <= 6) level = 3;
      else if (count > 6) level = 4;
      
      cells.push({ date: d, level, dateStr, count });
    }

    // Group into columns (weeks)
    const weeks: typeof cells[] = [];
    let currentWeek: typeof cells = [];
    
    // Pad first week if it doesn't start on Sunday
    const firstDay = cells[0].date.getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: new Date(0), level: -1, dateStr: '', count: 0 });
    }
    
    cells.forEach(cell => {
      currentWeek.push(cell);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), level: -1, dateStr: '', count: 0 });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [lectures]);

  // 3. Status Distribution Data
  const statusData = useMemo(() => {
    const counts = { 'not-started': 0, 'in-progress': 0, 'completed': 0, 'revision': 0 };
    lectures.forEach(l => counts[l.status]++);
    return [
      { name: 'Completed', value: counts['completed'], color: '#22c55e' },
      { name: 'In Progress', value: counts['in-progress'], color: '#eab308' },
      { name: 'Revision', value: counts['revision'], color: '#f97316' },
      { name: 'Not Started', value: counts['not-started'], color: '#64748b' },
    ].filter(d => d.value > 0);
  }, [lectures]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-xl shadow-black/50">
          <p className="text-foreground font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Study Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Visualize your learning progress and habits.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-background/50 border-border/50 hover:bg-accent/20"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-background/50 border-border/50 hover:bg-accent/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Study Hours', value: totalStudyHours.toFixed(1), icon: Timer, color: 'text-blue-500' },
          { label: 'Lectures Completed', value: getCompletedCount(), icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Current Streak', value: `${currentStreak} days`, icon: Flame, color: 'text-orange-500' },
          { label: 'Longest Streak', value: `${longestStreak} days`, icon: Trophy, color: 'text-yellow-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-background/50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Study Activity (Last 365 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-2">
              {/* Month labels row */}
              <div className="flex">
                {heatmapWeeks.map((week, wIdx) => {
                  // Show month label on the first week that starts a new month
                  const firstValidCell = week.find(c => c.level !== -1);
                  if (!firstValidCell) return <div key={wIdx} className="shrink-0" style={{ width: 15 }} />;

                  const showMonth =
                    wIdx === 0 ||
                    (() => {
                      // Find the previous week's first valid cell
                      for (let p = wIdx - 1; p >= 0; p--) {
                        const prev = heatmapWeeks[p].find(c => c.level !== -1);
                        if (prev) return firstValidCell.date.getMonth() !== prev.date.getMonth();
                      }
                      return true;
                    })();

                  return (
                    <div key={wIdx} className="shrink-0 text-xs text-muted-foreground/70" style={{ width: 15 }}>
                      {showMonth ? format(firstValidCell.date, 'MMM') : ''}
                    </div>
                  );
                })}
              </div>

              {/* Day labels + Grid */}
              <div className="flex mt-1">
                {/* Grid columns */}
                <div className="flex gap-[3px]">
                  {heatmapWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-[3px]">
                      {week.map((cell, dIdx) => {
                        if (cell.level === -1) {
                          return <div key={dIdx} className="w-[12px] h-[12px]" />;
                        }

                        const bgClasses = [
                          'bg-muted/30',
                          'bg-primary/40',
                          'bg-primary/60',
                          'bg-primary/80',
                          'bg-primary',
                        ];

                        return (
                          <div
                            key={dIdx}
                            className={`w-[12px] h-[12px] rounded-sm heatmap-cell ${bgClasses[cell.level]} transition-colors hover:ring-1 hover:ring-primary hover:scale-110 cursor-pointer`}
                            title={`${cell.dateStr}: ${cell.count} lectures completed`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="w-[12px] h-[12px] rounded-sm bg-muted/30"></div>
              <div className="w-[12px] h-[12px] rounded-sm bg-primary/40"></div>
              <div className="w-[12px] h-[12px] rounded-sm bg-primary/60"></div>
              <div className="w-[12px] h-[12px] rounded-sm bg-primary/80"></div>
              <div className="w-[12px] h-[12px] rounded-sm bg-primary"></div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Lectures per Week</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLectures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.20 270)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="oklch(0.65 0.20 270)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.25 0.02 270)" />
                  <XAxis dataKey="name" stroke="oklch(0.60 0.02 270)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.60 0.02 270)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="lectures" 
                    name="Lectures Completed" 
                    stroke="oklch(0.65 0.20 270)" 
                    fillOpacity={1} 
                    fill="url(#colorLectures)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Pie Chart */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card h-[460px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Overall Status</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col items-center justify-center">
              {statusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="80%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Pie chart legend */}
                  <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2">
                    {statusData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2 text-sm">
                        <span
                          className="inline-block h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                          {entry.name}: <span className="text-foreground font-medium">{entry.value}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">No data available</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Module Completion Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
          <Card className="glass-card h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Module Completion Rates</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={moduleStats} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="oklch(0.25 0.02 270)" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="module" type="category" width={120} stroke="oklch(0.60 0.02 270)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'oklch(0.20 0.02 270)', opacity: 0.4}} />
                  <Bar dataKey="percentage" name="Completion %" radius={[0, 4, 4, 0]}>
                    {moduleStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MODULE_COLORS[entry.module] || 'oklch(0.65 0.20 270)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
