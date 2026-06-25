import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MessageSquare,
} from 'lucide-react';
import { useData } from '@/lib/data-context';
import type { Module, LectureStatus } from '@/lib/types';
import { MODULE_LIST, MODULE_COLORS } from '@/lib/types';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Lectures() {
  const { lectures, updateLecture, bulkUpdateLectures } = useData();

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [pulsingId, setPulsingId] = useState<string | null>(null);

  const handleStatusChange = useCallback((id: string, newStatus: LectureStatus) => {
    updateLecture(id, { status: newStatus });
    if (newStatus === 'completed') {
      setPulsingId(id);
      setTimeout(() => setPulsingId(null), 700);
    }
  }, [updateLecture]);

  const cycleStatus = useCallback((id: string, currentStatus: LectureStatus) => {
    const sequence: LectureStatus[] = ['not-started', 'in-progress', 'completed', 'revision'];
    const nextIdx = (sequence.indexOf(currentStatus) + 1) % sequence.length;
    handleStatusChange(id, sequence[nextIdx]);
  }, [handleStatusChange]);

  // Derived filtered/sorted list
  const filteredLectures = useMemo(() => {
    let result = lectures;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(lower));
    }

    if (moduleFilter !== 'All') {
      result = result.filter(l => l.module === moduleFilter);
    }

    if (statusFilter !== 'All') {
      result = result.filter(l => {
        if (statusFilter === 'not-started') return l.status === 'not-started';
        if (statusFilter === 'in-progress') return l.status === 'in-progress';
        if (statusFilter === 'completed') return l.status === 'completed';
        if (statusFilter === 'revision') return l.status === 'revision';
        return true;
      });
    }

    if (sortBy === 'duration-asc') {
      result = [...result].sort((a, b) => a.duration - b.duration);
    } else if (sortBy === 'duration-desc') {
      result = [...result].sort((a, b) => b.duration - a.duration);
    } else if (sortBy === 'name-asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [lectures, search, moduleFilter, statusFilter, sortBy]);

  // Group filtered lectures by module
  const groupedLectures = useMemo(() => {
    const groups: Record<string, typeof filteredLectures> = {};
    // Ensure the order matches MODULE_LIST
    MODULE_LIST.forEach(m => {
      groups[m] = [];
    });
    
    filteredLectures.forEach(l => {
      if (!groups[l.module]) groups[l.module] = [];
      groups[l.module].push(l);
    });
    
    // Filter out empty modules
    Object.keys(groups).forEach(k => {
      if (groups[k].length === 0) delete groups[k];
    });
    
    return groups;
  }, [filteredLectures]);

  const toggleNotes = (id: string) => {
    const next = new Set(expandedNotes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNotes(next);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s > 0 ? s + 's' : ''}`;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Lecture Tracker</h1>
          <p className="text-muted-foreground mt-1">
            {filteredLectures.length} {filteredLectures.length === 1 ? 'lecture' : 'lectures'} found
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <Card className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search lectures..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Modules</SelectItem>
                {MODULE_LIST.map(mod => (
                  <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="revision">Revision</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Order</SelectItem>
                <SelectItem value="duration-asc">Duration (Shortest)</SelectItem>
                <SelectItem value="duration-desc">Duration (Longest)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Lecture List */}
      <div className="bg-card/50 rounded-xl border border-border/50 overflow-hidden backdrop-blur-sm">
        <div className="flex items-center gap-4 p-4 border-b border-border/50 bg-muted/20 text-base font-medium text-muted-foreground">
          <div className="flex-1 pl-2">Lecture Name</div>
          <div className="w-24 text-right">Duration</div>
          <div className="w-32 text-center">Status</div>
          <div className="w-16 text-right">Actions</div>
        </div>

        <div className="divide-y divide-border/30">
          {Object.entries(groupedLectures).map(([moduleName, moduleLectures]) => (
            <div key={moduleName} className="flex flex-col">
              <div className="sticky top-0 z-10 flex items-center gap-3 bg-muted/40 p-4 border-b border-border/30 backdrop-blur-md">
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: MODULE_COLORS[moduleName as Module] }} 
                />
                <h3 className="text-lg font-semibold text-foreground">{moduleName}</h3>
                <span className="text-sm font-normal text-muted-foreground ml-auto">{moduleLectures.length} lectures</span>
              </div>
              
              <div className="divide-y divide-border/30">
                {moduleLectures.map((lecture) => (
                  <div key={lecture.id} className={`group flex flex-col lecture-row transition-colors ${pulsingId === lecture.id ? 'completion-pulse' : ''}`}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex-1 min-w-0 pl-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-base truncate ${lecture.isProject ? 'text-primary' : 'text-foreground'}`}>
                      {lecture.name}
                    </span>
                    {lecture.revisionNeeded && (
                      <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 shrink-0">
                        Revision
                      </Badge>
                    )}
                    </div>
                  </div>

                  <div className="w-24 text-right text-base text-muted-foreground">
                    {formatDuration(lecture.duration)}
                  </div>

                  <div className="w-32 text-center">
                    <Select
                      value={lecture.status}
                      onValueChange={(val) => handleStatusChange(lecture.id, val as LectureStatus)}
                    >
                      <SelectTrigger className={`h-8 text-xs ${
                        lecture.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        lecture.status === 'in-progress' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        lecture.status === 'revision' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        'bg-background text-muted-foreground'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="revision">Revision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


                  <div className="w-16 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleNotes(lecture.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
              </div>

              {/* Expandable Notes */}
              <AnimatePresence>
                {expandedNotes.has(lecture.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-accent/5"
                  >
                    <div className="p-4 pt-0 pl-14 pr-4">
                      <textarea
                        className="w-full min-h-[100px] p-3 text-sm bg-background border border-border rounded-md resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Add notes for this lecture..."
                        value={lecture.notes}
                        onChange={(e) => updateLecture(lecture.id, { notes: e.target.value })}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
                ))}
              </div>
            </div>
          ))}

          {filteredLectures.length === 0 && (
            <div className="p-8 text-center text-base text-muted-foreground">
              No lectures found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
