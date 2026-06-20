import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitBranch,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Star,
  CheckCircle2,
  Hammer,
  RotateCcw,
} from 'lucide-react';
import { useData } from '@/lib/data-context';
import type { Module, ProjectStatus, Difficulty } from '@/lib/types';
import { MODULE_LIST, MODULE_COLORS } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Projects() {
  const { projects, updateProject, getCompletedProjectCount } = useData();

  const [moduleFilter, setModuleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (moduleFilter !== 'All') {
      result = result.filter(p => p.module === moduleFilter);
    }

    if (statusFilter !== 'All') {
      result = result.filter(p => p.status === statusFilter);
    }

    return result;
  }, [projects, moduleFilter, statusFilter]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedProjects);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProjects(next);
  };

  const cycleStatus = (id: string, currentStatus: ProjectStatus) => {
    const sequence: ProjectStatus[] = ['not-started', 'building', 'completed', 'revision'];
    const nextIdx = (sequence.indexOf(currentStatus) + 1) % sequence.length;
    updateProject(id, { status: sequence[nextIdx] });
  };

  const renderDifficulty = (difficulty: Difficulty) => {
    const count = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 2 : 3;
    const color = difficulty === 'beginner' ? 'text-green-500' : difficulty === 'intermediate' ? 'text-yellow-500' : 'text-red-500';
    
    return (
      <div className="flex gap-0.5" title={difficulty}>
        {[1, 2, 3].map(i => (
          <Star key={i} className={`h-3 w-3 ${i <= count ? color + ' fill-current' : 'text-muted-foreground/30'}`} />
        ))}
      </div>
    );
  };

  const renderStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'not-started':
        return <Badge variant="outline" className="text-muted-foreground">Not Started</Badge>;
      case 'building':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"><Hammer className="w-3 h-3 mr-1"/> Building</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Completed</Badge>;
      case 'revision':
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20"><RotateCcw className="w-3 h-3 mr-1"/> Revision</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text flex items-center gap-2">
            <FolderKanban className="h-8 w-8 text-primary" /> Project Tracker
          </h1>
          <p className="text-muted-foreground mt-2">
            {getCompletedProjectCount()} / {projects.length} projects completed
          </p>
        </div>
        
        {/* Filters */}
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
              <SelectItem value="building">Building</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="revision">Revision</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => {
            const isExpanded = expandedProjects.has(project.id);

            return (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.5) }}
              >
                <Card className="glass-card card-tilt flex flex-col h-full overflow-hidden hover:border-primary/50 transition-colors duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge 
                        variant="outline" 
                        className="bg-background/50"
                        style={{ borderColor: `${MODULE_COLORS[project.module]}50`, color: MODULE_COLORS[project.module] }}
                      >
                        {project.module}
                      </Badge>
                      {renderDifficulty(project.difficulty)}
                    </div>
                    <CardTitle className="text-xl leading-tight text-foreground/90">
                      {project.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="cursor-pointer" onClick={() => cycleStatus(project.id, project.status)}>
                        {renderStatusBadge(project.status)}
                      </div>
                      {project.completionDate && (
                        <div className="text-xs text-muted-foreground">
                          Done: {project.completionDate}
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-4 pt-2 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                              <GitBranch className="w-3.5 h-3.5" /> Repository URL
                            </label>
                            <Input 
                              placeholder="https://github.com/..." 
                              value={project.githubLink}
                              onChange={(e) => updateProject(project.id, { githubLink: e.target.value })}
                              className="h-8 text-sm bg-background/50"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                              <ExternalLink className="w-3.5 h-3.5" /> Live Demo URL
                            </label>
                            <Input 
                              placeholder="https://..." 
                              value={project.demoLink}
                              onChange={(e) => updateProject(project.id, { demoLink: e.target.value })}
                              className="h-8 text-sm bg-background/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Notes</label>
                            <textarea
                              className="w-full min-h-[80px] p-2 text-sm bg-background/50 border border-input rounded-md resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Project notes, challenges, learnings..."
                              value={project.notes}
                              onChange={(e) => updateProject(project.id, { notes: e.target.value })}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>

                  <CardFooter className="pt-0 border-t border-border/10">
                    <Button 
                      variant="ghost" 
                      className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 mt-2 h-8"
                      onClick={() => toggleExpand(project.id)}
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-4 h-4 mr-1" /> Hide Details</>
                      ) : (
                        <><ChevronDown className="w-4 h-4 mr-1" /> Show Details</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No projects found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
