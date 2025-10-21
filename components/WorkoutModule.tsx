import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Module from './Module';
import { DumbbellIcon, PlusIcon, XIcon, TrashIcon, ChevronLeftIcon, PencilIcon, CheckIcon, CalendarIcon, RepeatIcon, ChevronUpIcon, ChevronDownIcon, FileTextIcon, TimerIcon, ClipboardCheckIcon, PlayIcon, PauseIcon, RotateCcwIcon, ChevronRightIcon, DeleteIcon, GripVerticalIcon } from './icons';
import { format, parseISO } from 'date-fns';
import usePersistentState from '../hooks/usePersistentState';
import BottomSheet from './BottomSheet';


// --- DATA & TYPES ---

interface Exercise {
  name: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio';
}

interface WorkoutExercise extends Exercise {
  id: string; // Unique ID for the instance in the workout
  sets: number;
  reps: number;
  weight?: number; // Weight is optional
  rest?: number; // Rest time in seconds
  note?: string; // User-added notes
}

interface WorkoutPlan {
  id: number;
  name: string;
  exercises: WorkoutExercise[];
}

// --- New History Types ---
interface CompletedSet {
  reps: number;
  weight?: number;
  completed: boolean;
}

interface CompletedExercise {
  name: string;
  sets: CompletedSet[];
  note?: string; // Note from the plan at time of completion
}

interface WorkoutSessionRecord {
  id: number;
  planId: number;
  planName: string;
  completedAt: string; // ISO string
  exercises: CompletedExercise[];
}


const EXERCISE_LIBRARY: Exercise[] = [
  // Chest
  { name: 'Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { name: 'Push-ups', muscleGroup: 'Chest' },
  { name: 'Cable Crossover', muscleGroup: 'Chest' },
  // Back
  { name: 'Pull-ups', muscleGroup: 'Back' },
  { name: 'Deadlift', muscleGroup: 'Back' },
  { name: 'Bent-Over Row', muscleGroup: 'Back' },
  { name: 'Lat Pulldown', muscleGroup: 'Back' },
  // Legs
  { name: 'Squat', muscleGroup: 'Legs' },
  { name: 'Leg Press', muscleGroup: 'Legs' },
  { name: 'Lunges', muscleGroup: 'Legs' },
  { name: 'Calf Raises', muscleGroup: 'Legs' },
  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { name: 'Lateral Raises', muscleGroup: 'Shoulders' },
  { name: 'Face Pulls', muscleGroup: 'Shoulders' },
  // Arms
  { name: 'Bicep Curls', muscleGroup: 'Arms' },
  { name: 'Tricep Dips', muscleGroup: 'Arms' },
  { name: 'Hammer Curls', muscleGroup: 'Arms' },
  // Core
  { name: 'Plank', muscleGroup: 'Core' },
  { name: 'Crunches', muscleGroup: 'Core' },
  { name: 'Leg Raises', muscleGroup: 'Core' },
  // Cardio
  { name: 'Running', muscleGroup: 'Cardio' },
  { name: 'Cycling', muscleGroup: 'Cardio' },
];

const MUSCLE_GROUPS: Exercise['muscleGroup'][] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];

// Used to seed the user's library if it's empty
const INITIAL_PLANS: Omit<WorkoutPlan, 'id'>[] = [
  {
    name: 'Full Body Beginner',
    exercises: [
      { id: 'initial-1-1', name: 'Squat', muscleGroup: 'Legs', sets: 3, reps: 10, rest: 60 },
      { id: 'initial-1-2', name: 'Push-ups', muscleGroup: 'Chest', sets: 3, reps: 10, note: 'Go for full range of motion.', rest: 60 },
      { id: 'initial-1-3', name: 'Bent-Over Row', muscleGroup: 'Back', sets: 3, reps: 10, rest: 60 },
      { id: 'initial-1-4', name: 'Overhead Press', muscleGroup: 'Shoulders', sets: 3, reps: 8, rest: 60 },
      { id: 'initial-1-5', name: 'Plank', muscleGroup: 'Core', sets: 3, reps: 30, rest: 45 },
    ],
  },
  {
    name: 'Upper Body Push',
    exercises: [
      { id: 'initial-2-1', name: 'Bench Press', muscleGroup: 'Chest', sets: 4, reps: 8, weight: 60, rest: 90 },
      { id: 'initial-2-2', name: 'Overhead Press', muscleGroup: 'Shoulders', sets: 3, reps: 10, weight: 40, rest: 60 },
      { id: 'initial-2-3', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', sets: 3, reps: 12, weight: 20, rest: 60 },
      { id: 'initial-2-4', name: 'Lateral Raises', muscleGroup: 'Shoulders', sets: 3, reps: 15, weight: 10, note: 'Control the negative.', rest: 45 },
      { id: 'initial-2-5', name: 'Tricep Dips', muscleGroup: 'Arms', sets: 3, reps: 12, rest: 60 },
    ],
  },
];


// --- MAIN COMPONENT ---

const WorkoutModule: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [view, setView] = useState<'list' | 'builder' | 'session' | 'historyDetail' | 'timer'>('list');
  const [workoutPlans, setWorkoutPlans] = usePersistentState<WorkoutPlan[]>('workoutPlans', []);
  const [workoutHistory, setWorkoutHistory] = usePersistentState<WorkoutSessionRecord[]>('workoutHistory', []);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<WorkoutSessionRecord | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [confirmingLogPlan, setConfirmingLogPlan] = useState<WorkoutPlan | null>(null);

  // Builder state
  const [builderPlan, setBuilderPlan] = useState<Partial<WorkoutPlan>>({ name: '', exercises: [] });
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Seed initial plans if local storage is empty
  useEffect(() => {
    const storedPlans = localStorage.getItem('workoutPlans');
    if (!storedPlans) {
        const initialPlansWithIds = INITIAL_PLANS.map((plan, index) => ({
            ...plan,
            id: Date.now() + index,
            exercises: plan.exercises.map(ex => ({...ex, id: `${Date.now() + index}-${ex.name}-${Math.random()}`})),
        }));
        setWorkoutPlans(initialPlansWithIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartWorkout = (plan: WorkoutPlan) => {
    setActivePlan(plan);
    setView('session');
  };

  const handleFinishWorkout = (sessionProgress: Record<string, CompletedSet[]>) => {
    if (!activePlan) return;

    const completedExercises: CompletedExercise[] = activePlan.exercises.map(ex => ({
        name: ex.name,
        note: ex.note,
        sets: sessionProgress[ex.id] || Array(ex.sets).fill({ reps: ex.reps, weight: ex.weight, completed: false }),
    }));

    const newHistoryRecord: WorkoutSessionRecord = {
        id: Date.now(),
        planId: activePlan.id,
        planName: activePlan.name,
        completedAt: new Date().toISOString(),
        exercises: completedExercises,
    };

    setWorkoutHistory([newHistoryRecord, ...workoutHistory]);
    setActivePlan(null);
    setView('list');
  };
  
  const handleCancelWorkout = () => {
    setActivePlan(null);
    setView('list');
  };

  const handleQuickLog = (plan: WorkoutPlan) => {
    setConfirmingLogPlan(plan);
  };
  
  const confirmQuickLog = () => {
    if (!confirmingLogPlan) return;

    const planToLog = confirmingLogPlan;
    const completedExercises: CompletedExercise[] = planToLog.exercises.map(ex => ({
        name: ex.name,
        note: ex.note,
        sets: Array.from({ length: ex.sets }).map(() => ({
            reps: ex.reps,
            weight: ex.weight,
            completed: true,
        })),
    }));

    const newHistoryRecord: WorkoutSessionRecord = {
        id: Date.now(),
        planId: planToLog.id,
        planName: planToLog.name,
        completedAt: new Date().toISOString(),
        exercises: completedExercises,
    };

    setWorkoutHistory([newHistoryRecord, ...workoutHistory]);
    setConfirmingLogPlan(null);
  };

  const startNewPlan = () => {
    setBuilderPlan({ name: 'My New Plan', exercises: [], id: undefined });
    setView('builder');
  };
  
  const handleEditPlan = (plan: WorkoutPlan) => {
    setBuilderPlan(JSON.parse(JSON.stringify(plan))); // Deep copy to avoid mutation
    setView('builder');
  };

  const handleDeletePlan = (planId: number) => {
    setDeletingPlanId(planId);
  };
  
  const confirmDeletePlan = () => {
    if (deletingPlanId !== null) {
      setWorkoutPlans(workoutPlans.filter(p => p.id !== deletingPlanId));
      setDeletingPlanId(null);
    }
  };

  const cancelDeletePlan = () => {
    setDeletingPlanId(null);
  };

  const handleSavePlan = (planToSave: Partial<WorkoutPlan>) => {
    if (!planToSave.name || planToSave.name.trim() === '' || !planToSave.exercises || planToSave.exercises.length === 0) {
        alert("Plan must have a name and at least one exercise.");
        return;
    }

    if (planToSave.id) {
      setWorkoutPlans(workoutPlans.map(p => p.id === planToSave.id ? (planToSave as WorkoutPlan) : p));
    } else {
      setWorkoutPlans([...workoutPlans, { ...planToSave, id: Date.now() } as WorkoutPlan]);
    }
    setView('list');
  };

  const addExercisesToBuilder = (exercises: Exercise[]) => {
    const newExercises: WorkoutExercise[] = exercises.map(exercise => ({
        ...exercise,
        id: `${Date.now()}-${exercise.name}-${Math.random()}`,
        sets: 3,
        reps: 10,
        rest: 60,
    }));
    setBuilderPlan(p => ({ ...p, exercises: [...(p.exercises || []), ...newExercises]}));
  };

  const handleSelectHistoryEntry = (entry: WorkoutSessionRecord) => {
    setSelectedHistoryEntry(entry);
    setView('historyDetail');
  };

  const renderContent = () => {
    switch (view) {
      case 'list':
      case 'session': // The session view is now rendered outside the module chrome
        return <WorkoutListView 
                    plans={workoutPlans}
                    history={workoutHistory}
                    onStartNew={startNewPlan} 
                    onStartWorkout={handleStartWorkout}
                    onEditPlan={handleEditPlan}
                    onDeletePlan={handleDeletePlan}
                    deletingPlanId={deletingPlanId}
                    onConfirmDelete={confirmDeletePlan}
                    onCancelDelete={cancelDeletePlan}
                    onSelectHistory={handleSelectHistoryEntry}
                    onQuickLog={handleQuickLog}
                    onOpenTimer={() => setView('timer')}
                />;
      case 'builder':
        return (
          <WorkoutBuilder 
            plan={builderPlan} 
            setPlan={setBuilderPlan}
            onAddExercises={() => setIsLibraryOpen(true)}
            onSave={handleSavePlan}
            onCancel={() => setView('list')}
          />
        );
      case 'historyDetail':
        return selectedHistoryEntry ? (
            <WorkoutHistoryDetail 
                entry={selectedHistoryEntry} 
                onBack={() => {
                    setSelectedHistoryEntry(null);
                    setView('list');
                }}
            />
        ) : null;
      case 'timer':
        return <IntervalTimer onClose={() => setView('list')} />;
    }
  };

  const getModuleTitle = () => {
    switch (view) {
      case 'session': return activePlan ? `Session: ${activePlan.name}` : 'Workout Session';
      case 'builder': return 'Workout Builder';
      case 'historyDetail': return 'Workout Summary';
      case 'timer': return 'Interval Timer';
      default: return 'Workout';
    }
  }

  return (
    <>
      <Module title={getModuleTitle()} icon={<DumbbellIcon />} className={className}>
        {renderContent()}
      </Module>

      {view === 'session' && activePlan && (
        <WorkoutSessionFocusView
          plan={activePlan}
          onFinish={handleFinishWorkout}
          onCancel={handleCancelWorkout}
        />
      )}
      
      {isLibraryOpen && <ExerciseLibraryModal onAdd={addExercisesToBuilder} onClose={() => setIsLibraryOpen(false)} />}
      
      {confirmingLogPlan && (
        <BottomSheet
            isOpen={true}
            onClose={() => setConfirmingLogPlan(null)}
            title="Confirm Quick Log"
            primaryAction={{label: "Confirm", onClick: confirmQuickLog}}
            secondaryAction={{label: "Cancel", onClick: () => setConfirmingLogPlan(null)}}
        >
            <div className="p-4 text-center">
                <p className="text-body">
                    Log "{confirmingLogPlan.name}" as completed with all sets and reps as planned?
                </p>
            </div>
        </BottomSheet>
      )}
    </>
  );
};

// --- SUB-COMPONENTS ---

const WorkoutListView: React.FC<{
    plans: WorkoutPlan[];
    history: WorkoutSessionRecord[];
    onStartNew: () => void;
    onStartWorkout: (plan: WorkoutPlan) => void;
    onEditPlan: (plan: WorkoutPlan) => void;
    onDeletePlan: (planId: number) => void;
    deletingPlanId: number | null;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;
    onSelectHistory: (entry: WorkoutSessionRecord) => void;
    onQuickLog: (plan: WorkoutPlan) => void;
    onOpenTimer: () => void;
}> = (props) => {
    const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');

    const historySummary = useMemo(() => {
        if (props.history.length === 0) {
            return { totalWorkouts: 0, favoritePlan: 'N/A' };
        }

        const planCounts = props.history.reduce((acc, entry) => {
            acc[entry.planName] = (acc[entry.planName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const favoritePlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

        return {
            totalWorkouts: props.history.length,
            favoritePlan: favoritePlan || 'N/A',
        };
    }, [props.history]);

    return (
        <div>
            <div role="tablist" aria-label="Workout views" className="flex border-b border-white/10 mb-4">
                <button 
                    role="tab"
                    id="tab-plans"
                    aria-controls="panel-plans"
                    aria-selected={activeTab === 'plans'}
                    onClick={() => setActiveTab('plans')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'plans' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                    My Plans
                </button>
                <button 
                    role="tab"
                    id="tab-history"
                    aria-controls="panel-history"
                    aria-selected={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'history' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                    History
                </button>
            </div>

            <div role="tabpanel" id="panel-plans" aria-labelledby="tab-plans" hidden={activeTab !== 'plans'}>
              <div className="flex gap-2 mb-4">
                <button onClick={props.onStartNew} className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 rounded-lg text-center hover:bg-white/10 text-indigo-300">
                    <PlusIcon /> <span className="font-semibold text-sm">Create Plan</span>
                </button>
                <button onClick={props.onOpenTimer} className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 rounded-lg text-center hover:bg-white/10 text-indigo-300">
                    <TimerIcon /> <span className="font-semibold text-sm">Interval Timer</span>
                </button>
              </div>
              <WorkoutPlanList 
                  plans={props.plans}
                  onStartWorkout={props.onStartWorkout}
                  onEdit={props.onEditPlan}
                  onDelete={props.onDeletePlan}
                  deletingPlanId={props.deletingPlanId}
                  onConfirmDelete={props.onConfirmDelete}
                  onCancelDelete={props.onCancelDelete}
                  onQuickLog={props.onQuickLog}
              />
            </div>
            <div role="tabpanel" id="panel-history" aria-labelledby="tab-history" hidden={activeTab !== 'history'}>
              <WorkoutHistoryList 
                  history={props.history}
                  summary={historySummary}
                  onSelect={props.onSelectHistory}
              />
            </div>
        </div>
    );
};

const WorkoutPlanList: React.FC<{
  plans: WorkoutPlan[];
  onStartWorkout: (plan: WorkoutPlan) => void;
  onEdit: (plan: WorkoutPlan) => void;
  onDelete: (planId: number) => void;
  deletingPlanId: number | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onQuickLog: (plan: WorkoutPlan) => void;
}> = ({ plans, onStartWorkout, onEdit, onDelete, deletingPlanId, onConfirmDelete, onCancelDelete, onQuickLog }) => {
    return (
        <div>
            {plans.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {plans.map(plan => (
                        <div key={plan.id} className={`p-4 bg-white/5 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${deletingPlanId === plan.id ? 'bg-red-500/10' : ''}`}>
                            {deletingPlanId === plan.id ? (
                                <div className="w-full flex items-center justify-between text-sm">
                                    <span className="text-red-400 font-semibold">Delete this plan?</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={onConfirmDelete} className="p-2 rounded-full text-white bg-red-600 hover:bg-red-700" aria-label={`Confirm delete ${plan.name} plan`}><CheckIcon className="w-4 h-4" /></button>
                                        <button onClick={onCancelDelete} className="p-2 rounded-full text-gray-300 bg-white/10 hover:bg-white/20" aria-label="Cancel delete plan"><XIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h4 className="font-semibold text-white">{plan.name}</h4>
                                        <p className="text-xs text-gray-400">{plan.exercises.length} exercises</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => onEdit(plan)} className="p-2 rounded-md bg-white/10 text-gray-300 hover:text-white hover:bg-white/20" aria-label={`Edit ${plan.name} plan`}><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => onDelete(plan.id)} className="p-2 rounded-md bg-white/10 text-gray-300 hover:text-red-400 hover:bg-red-500/20" aria-label={`Delete ${plan.name} plan`}><TrashIcon className="w-4 h-4" /></button>
                                        <button onClick={() => onQuickLog(plan)} className="p-2 rounded-md bg-white/10 text-gray-300 hover:text-white hover:bg-white/20" aria-label={`Log ${plan.name} workout`}><ClipboardCheckIcon className="w-4 h-4" /></button>
                                        <button onClick={() => onStartWorkout(plan)} className="px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">Start</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-4 border-2 border-dashed border-white/10 rounded-lg">
                    <p>You haven't created any plans yet.</p>
                </div>
            )}
        </div>
    );
};

interface HistorySummary {
    totalWorkouts: number;
    favoritePlan: string;
}

const WorkoutHistoryList: React.FC<{
    history: WorkoutSessionRecord[];
    summary: HistorySummary;
    onSelect: (entry: WorkoutSessionRecord) => void;
}> = ({ history, summary, onSelect }) => {
    
    const StatCard = ({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) => (
        <div className="bg-white/5 p-4 rounded-lg text-center flex-1">
            <div className="text-indigo-300 w-6 h-6 mx-auto mb-2" aria-hidden="true">{icon}</div>
            <div className="text-xl font-bold text-white truncate" title={String(value)}>{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
        </div>
    );

    if (history.length === 0) {
        return (
            <div className="text-center text-gray-400 py-4 border-2 border-dashed border-white/10 rounded-lg">
                <p>No workout history found.</p>
                <p className="text-sm">Complete a workout to see it here!</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 flex gap-4">
                <StatCard label="Total Workouts" value={summary.totalWorkouts} icon={<DumbbellIcon />} />
                <StatCard label="Favorite Plan" value={summary.favoritePlan} icon={<RepeatIcon />} />
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {history.map(entry => (
                    <button key={entry.id} onClick={() => onSelect(entry)} className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-white">{entry.planName}</h4>
                            <p className="text-xs text-gray-400">{format(parseISO(entry.completedAt), 'MMMM d, yyyy')}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

const EditableExerciseItem: React.FC<{
    exercise: WorkoutExercise;
    onUpdate: (id: string, field: keyof WorkoutExercise, value: any) => void;
    onRemove: (id: string) => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    isDragging: boolean;
}> = ({ exercise, onUpdate, onRemove, onDragStart, onDragEnd, isDragging }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [note, setNote] = useState(exercise.note || '');
    
    const handleNoteBlur = () => {
        if (note !== exercise.note) {
            onUpdate(exercise.id, 'note', note);
        }
    };
    
    const summary = `${exercise.muscleGroup} | ${exercise.sets} sets | ${exercise.reps} reps${exercise.weight ? ` | ${exercise.weight}kg` : ''}${exercise.rest ? ` | ${exercise.rest}s rest` : ''}`;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={`bg-white/5 rounded-lg transition-all duration-300 ${isDragging ? 'opacity-50 ring-2 ring-indigo-500' : 'opacity-100 ring-0'}`}
        >
            <div className="flex items-center p-4">
                <div className="cursor-grab touch-none" aria-label={`Drag to reorder ${exercise.name}`}>
                    <GripVerticalIcon className="w-6 h-6 text-gray-500" />
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className="flex-grow text-left mx-2">
                    <h4 className="font-semibold text-white">{exercise.name}</h4>
                    <p className="text-xs text-gray-400">{summary}</p>
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => onRemove(exercise.id)} className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/20">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-full text-gray-400 hover:text-white">
                        {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4">
                        <InputGroup id={`sets-${exercise.id}`} label="Sets" type="number" value={exercise.sets} onChange={e => onUpdate(exercise.id, 'sets', parseInt(e.target.value) || 0)} />
                        <InputGroup id={`reps-${exercise.id}`} label="Reps" type="number" value={exercise.reps} onChange={e => onUpdate(exercise.id, 'reps', parseInt(e.target.value) || 0)} />
                        <InputGroup id={`weight-${exercise.id}`} label="Weight (kg)" type="number" value={exercise.weight ?? ''} onChange={e => onUpdate(exercise.id, 'weight', parseFloat(e.target.value) || 0)} placeholder="-" />
                        <InputGroup id={`rest-${exercise.id}`} label="Rest (sec)" type="number" value={exercise.rest ?? ''} onChange={e => onUpdate(exercise.id, 'rest', parseInt(e.target.value) || 0)} placeholder="-" />
                    </div>
                    <div className="mt-4">
                        <label htmlFor={`muscleGroup-${exercise.id}`} className="block text-xs text-gray-400 mb-1">Muscle Group</label>
                        <select
                            id={`muscleGroup-${exercise.id}`}
                            value={exercise.muscleGroup}
                            onChange={e => onUpdate(exercise.id, 'muscleGroup', e.target.value as Exercise['muscleGroup'])}
                            className="w-full bg-black/30 text-white border border-transparent rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        >
                            {MUSCLE_GROUPS.map(group => (
                                <option key={group} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-4">
                         <label htmlFor={`note-${exercise.id}`} className="block text-xs text-gray-400 mb-1">Note</label>
                         <textarea
                            id={`note-${exercise.id}`}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            onBlur={handleNoteBlur}
                            placeholder="e.g., focus on form, slow negative..."
                            className="w-full bg-black/30 text-white placeholder-gray-400 border border-transparent rounded-md p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            rows={2}
                         />
                    </div>
                </div>
            )}
        </div>
    );
};

const InputGroup: React.FC<{id: string, label: string, type: string, value: string|number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string}> = 
({id, label, ...props}) => (
    <div>
        <label htmlFor={id} className="block text-xs text-gray-400 mb-1">{label}</label>
        <input id={id} {...props} className="w-full bg-black/30 rounded p-2 text-center" />
    </div>
);

const WorkoutBuilder: React.FC<{
    plan: Partial<WorkoutPlan>;
    setPlan: React.Dispatch<React.SetStateAction<Partial<WorkoutPlan>>>;
    onAddExercises: () => void;
    onSave: (plan: Partial<WorkoutPlan>) => void;
    onCancel: () => void;
}> = ({ plan, setPlan, onAddExercises, onSave, onCancel }) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handlePlanNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlan(p => ({ ...p, name: e.target.value }));
    };

    const handleUpdateExercise = (id: string, field: keyof WorkoutExercise, value: any) => {
        setPlan(p => ({
            ...p,
            exercises: (p.exercises || []).map(ex => 
                ex.id === id ? { ...ex, [field]: value } : ex
            ),
        }));
    };
    
    const handleRemoveExercise = (id: string) => {
        setPlan(p => ({
            ...p,
            exercises: (p.exercises || []).filter(ex => ex.id !== id),
        }));
    };
    
    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Setting a minimal drag image for a cleaner look
        const dragImage = new Image();
        dragImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        e.dataTransfer.setDragImage(dragImage, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (index !== dragOverIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null) return;
        
        const exercises = [...(plan.exercises || [])];
        const draggedItem = exercises.splice(draggedIndex, 1)[0];
        exercises.splice(dropIndex, 0, draggedItem);
        
        setPlan(p => ({ ...p, exercises }));
        setDraggedIndex(null);
        setDragOverIndex(null);
    };
    
    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };
    
    return (
        <div>
            <header className="flex justify-between items-center mb-4">
                <button onClick={onCancel} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"><ChevronLeftIcon className="w-4 h-4" /> Back</button>
                <button onClick={() => onSave(plan)} className="px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 font-semibold text-white">Save Plan</button>
            </header>
            
            <input
                type="text"
                value={plan.name}
                onChange={handlePlanNameChange}
                placeholder="Workout Plan Name"
                className="w-full bg-transparent text-xl font-bold text-white mb-4 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                aria-label="Plan Name"
            />
            
            <div 
                className="space-y-3 max-h-[60vh] overflow-y-auto pr-2"
                onDragLeave={handleDragLeave}
            >
                {(plan.exercises || []).length > 0 ? (plan.exercises || []).map((ex, index) => (
                    <div 
                        key={ex.id}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        className="relative"
                    >
                         {dragOverIndex === index && draggedIndex !== index && (
                           <div className="absolute -top-1.5 left-0 right-0 h-1 bg-indigo-400 rounded-full" />
                         )}
                         <EditableExerciseItem
                            exercise={ex}
                            onUpdate={handleUpdateExercise}
                            onRemove={handleRemoveExercise}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            isDragging={draggedIndex === index}
                         />
                    </div>
                )) : (
                     <div className="text-center text-gray-400 py-12 border-2 border-dashed border-white/10 rounded-lg">
                        <p className="font-semibold">Your plan is empty.</p>
                        <p className="text-sm">Add exercises to get started.</p>
                     </div>
                )}
            </div>

            <button onClick={onAddExercises} className="mt-4 w-full p-4 bg-white/5 rounded-lg hover:bg-white/10 text-indigo-300 font-semibold flex items-center justify-center gap-2">
                <PlusIcon /> Add Exercise
            </button>
        </div>
    );
};

const ExerciseLibraryModal: React.FC<{
    onAdd: (exercises: Exercise[]) => void;
    onClose: () => void;
}> = ({ onAdd, onClose }) => {
    const [filter, setFilter] = useState<Exercise['muscleGroup'] | 'All'>('All');
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

    const handleToggleExercise = (exercise: Exercise) => {
        setSelectedExercises(prev => {
            if (prev.some(e => e.name === exercise.name)) {
                return prev.filter(e => e.name !== exercise.name);
            } else {
                return [...prev, exercise];
            }
        });
    };
    
    const filteredExercises = useMemo(() => 
        filter === 'All' 
            ? EXERCISE_LIBRARY 
            : EXERCISE_LIBRARY.filter(ex => ex.muscleGroup === filter),
        [filter]
    );
    
    const handleAddAndClose = () => {
        onAdd(selectedExercises);
        onClose();
    };

    return (
        <BottomSheet
            isOpen={true}
            onClose={onClose}
            title="Exercise Library"
            primaryAction={{
                label: `Add ${selectedExercises.length > 0 ? `${selectedExercises.length} ` : ''}Exercises`,
                onClick: handleAddAndClose,
                disabled: selectedExercises.length === 0,
            }}
        >
            <div className="px-4 pt-2 pb-4 flex flex-col h-[70vh]">
                <div role="tablist" aria-label="Muscle groups" className="flex flex-wrap gap-2 mb-4 flex-shrink-0 overflow-x-auto">
                    <button role="tab" aria-selected={filter === 'All'} onClick={() => setFilter('All')} className={`px-4 py-2 text-sm rounded-full ${filter === 'All' ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}>All</button>
                    {MUSCLE_GROUPS.map(group => (
                        <button key={group} role="tab" aria-selected={filter === group} onClick={() => setFilter(group)} className={`px-4 py-2 text-sm rounded-full ${filter === group ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{group}</button>
                    ))}
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2" role="group" aria-label="Select exercises">
                    {filteredExercises.map(ex => {
                        const isSelected = selectedExercises.some(e => e.name === ex.name);
                        return (
                            <button key={ex.name} onClick={() => handleToggleExercise(ex)} role="checkbox" aria-checked={isSelected} className={`w-full text-left p-4 rounded-lg flex justify-between items-center transition-all ${isSelected ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : 'bg-white/5 hover:bg-white/10'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-400' : 'border-gray-400'}`} aria-hidden="true">
                                        {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                                    </div>
                                    <span>{ex.name}</span>
                                </div>
                                <span className="text-xs text-gray-400">{ex.muscleGroup}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </BottomSheet>
    );
};

const NumericInputPad: React.FC<{
    initialValue: number | string;
    onSave: (value: number) => void;
    onClose: () => void;
    label: string;
    allowDecimal: boolean;
}> = ({ initialValue, onSave, onClose, label, allowDecimal }) => {
    const [displayValue, setDisplayValue] = useState(String(initialValue || ''));
    
    const handleKeyPress = (key: string) => {
        if (key === 'backspace') {
            setDisplayValue(prev => prev.slice(0, -1) || '');
        } else if (key === '.' && allowDecimal && !displayValue.includes('.')) {
            setDisplayValue(prev => prev + '.');
        } else if (!isNaN(parseInt(key, 10))) {
            setDisplayValue(prev => prev + key);
        }
    };
    
    const handleSave = () => {
        onSave(parseFloat(displayValue) || 0);
    };

    const keys = [ '1', '2', '3', '4', '5', '6', '7', '8', '9', allowDecimal ? '.' : null, '0', 'backspace' ].filter(Boolean) as string[];

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center p-4 text-white font-sans">
            <header className="w-full flex justify-between items-center mb-4">
                <button onClick={onClose} className="p-2 text-gray-400 text-lg">Cancel</button>
                <button onClick={handleSave} className="p-2 text-indigo-400 text-lg font-semibold">Done</button>
            </header>
            <div className="flex-grow flex flex-col items-center justify-center w-full">
                <p className="text-2xl text-gray-400 capitalize">{label}</p>
                <p className="text-8xl font-mono font-bold my-4 min-h-[96px] break-all">{displayValue || '0'}</p>
            </div>
            <div className="w-full max-w-sm grid grid-cols-3 gap-2">
                {keys.map(key => (
                    <button 
                        key={key} 
                        onClick={() => handleKeyPress(key)}
                        className="h-20 bg-gray-800/80 rounded-lg text-4xl font-semibold active:bg-gray-700"
                    >
                        {key === 'backspace' ? <DeleteIcon className="mx-auto w-10 h-10" /> : key}
                    </button>
                ))}
            </div>
        </div>
    );
};

const WorkoutSessionFocusView: React.FC<{
  plan: WorkoutPlan;
  onFinish: (sessionProgress: Record<string, CompletedSet[]>) => void;
  onCancel: () => void;
}> = ({ plan, onFinish, onCancel }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionProgress, setSessionProgress] = useState<Record<string, CompletedSet[]>>({});
  const [workoutState, setWorkoutState] = useState<'working' | 'resting' | 'paused'>('working');
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(60);
  const [editingField, setEditingField] = useState<'reps' | 'weight' | null>(null);
  const [confirmAction, setConfirmAction] = useState<'finish' | 'cancel' | null>(null);

  const totalTimerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousStateRef = useRef<'working' | 'resting'>('working');

  const currentExercise = plan.exercises[currentExerciseIndex];

  useEffect(() => {
    if (!currentExercise) {
        onCancel();
    }
  }, [currentExercise, onCancel]);

  if (!currentExercise) {
    return null;
  }
  
  const currentSets = sessionProgress[currentExercise.id] || [];
  const currentSetIndex = currentSets.findIndex(set => !set.completed);
  // FIX: Cast `currentExercise.sets` to a Number to handle cases where it might be a string from storage, preventing an error with the arithmetic operation.
  const isLastSetOfExercise = currentSetIndex === Number(currentExercise.sets) - 1;
  const isLastExercise = currentExerciseIndex === plan.exercises.length - 1;

  const playSound = useCallback((type: 'work' | 'rest') => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(type === 'work' ? 880 : 440, ctx.currentTime);
    g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 1);
  }, []);
  const vibrate = (pattern: number | number[]) => { if ('vibrate' in navigator) navigator.vibrate(pattern); };

  useEffect(() => {
    const initialProgress: Record<string, CompletedSet[]> = {};
    plan.exercises.forEach(ex => {
      // FIX: Cast `ex.sets` to a Number as it may be a string from storage, which would cause `Array.from` to fail.
      initialProgress[ex.id] = Array.from({ length: Number(ex.sets) }).map(() => ({ reps: ex.reps, weight: ex.weight, completed: false }));
    });
    setSessionProgress(initialProgress);
  }, [plan]);

  useEffect(() => {
    if (workoutState === 'working' || workoutState === 'resting') {
        totalTimerRef.current = window.setInterval(() => setTotalSeconds(s => s + 1), 1000);
    } else if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current);
    }
    return () => { if (totalTimerRef.current) clearInterval(totalTimerRef.current); };
  }, [workoutState]);

  useEffect(() => {
    const restDuration = currentExercise.rest || 60;
    if (workoutState === 'resting') {
      setRestSeconds(restDuration);
      restTimerRef.current = window.setInterval(() => {
        setRestSeconds(s => {
          if (s <= 1) { playSound('work'); vibrate([100, 50, 100]); setWorkoutState('working'); return restDuration; }
          return s - 1;
        });
      }, 1000);
    } else { if (restTimerRef.current) clearInterval(restTimerRef.current); setRestSeconds(restDuration); }
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, [workoutState, playSound, vibrate, currentExercise.rest]);

  const updateSet = (field: keyof CompletedSet, value: any) => {
    setSessionProgress(prev => {
      const newSets = [...(prev[currentExercise.id] || [])];
      newSets[currentSetIndex] = { ...newSets[currentSetIndex], [field]: value };
      return { ...prev, [currentExercise.id]: newSets };
    });
  };

  const handleTogglePause = () => {
    setWorkoutState(currentState => {
        if (currentState === 'paused') {
            return previousStateRef.current;
        } 
        
        previousStateRef.current = currentState;
        return 'paused';
    });
  };

  const handleConfirm = () => {
    if (confirmAction === 'finish') {
        onFinish(sessionProgress);
    } else if (confirmAction === 'cancel') {
        onCancel();
    }
    setConfirmAction(null);
  };

  const handleCompleteSet = () => { updateSet('completed', true); if (!isLastSetOfExercise) { playSound('rest'); vibrate(200); setWorkoutState('resting'); } };
  const handleNextExercise = () => { if (currentExerciseIndex < plan.exercises.length - 1) { setCurrentExerciseIndex(i => i + 1); setWorkoutState('working'); } };
  const handlePrevExercise = () => { if (currentExerciseIndex > 0) { setCurrentExerciseIndex(i => i - 1); setWorkoutState('working'); } };
  const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(11, 8);

  return (
    <>
      <div className="fixed inset-0 bg-black z-50 flex flex-col p-4 text-white font-sans">
        <header className="flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirmAction('cancel')} className="p-2 text-gray-400 hover:text-white" aria-label="Cancel Workout"><XIcon className="w-8 h-8" /></button>
            <button onClick={handleTogglePause} className="p-2" aria-label={workoutState === 'paused' ? 'Resume Workout' : 'Pause Workout'}>
                {workoutState === 'paused' ? <PlayIcon className="w-8 h-8" /> : <PauseIcon className="w-8 h-8" />}
            </button>
          </div>
          <div className="text-center"><p className="text-3xl font-mono tracking-wider">{formatTime(totalSeconds)}</p><p className="text-sm text-gray-400">Total Time</p></div>
          <button onClick={() => setConfirmAction('finish')} className="px-4 py-2 bg-red-600 rounded-lg text-sm font-semibold">Finish</button>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center text-center relative">
          <button onClick={handlePrevExercise} disabled={currentExerciseIndex === 0} className="absolute left-0 p-4 disabled:opacity-20"><ChevronLeftIcon className="w-10 h-10" /></button>
          <button onClick={handleNextExercise} disabled={isLastExercise} className="absolute right-0 p-4 disabled:opacity-20"><ChevronRightIcon className="w-10 h-10" /></button>

          <div className="w-full px-12">
              <p className="text-gray-400 text-lg">{currentExerciseIndex + 1} / {plan.exercises.length}</p>
              <h1 className="text-4xl md:text-5xl font-bold my-2 truncate">{currentExercise.name}</h1>
              
              {workoutState === 'resting' ? (
                  <div className="my-8"><p className="text-3xl text-blue-400 font-semibold mb-2">REST</p><p className="text-8xl font-mono font-bold">{restSeconds}</p><button onClick={() => setWorkoutState('working')} className="mt-4 px-4 py-2 text-sm bg-white/10 rounded-full">Skip Rest</button></div>
              ) : (
                  <div className="my-4">
                      <h2 className="text-5xl font-semibold text-indigo-300">Set {currentSetIndex + 1}<span className="text-3xl text-gray-400">/{currentExercise.sets}</span></h2>
                      <div className="grid grid-cols-2 gap-4 mt-6">
                          <button onClick={() => setEditingField('reps')} disabled={workoutState === 'paused'} className="bg-gray-800 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              <label className="text-lg text-gray-400">Reps</label>
                              <div className="text-white text-5xl font-bold">{currentSets[currentSetIndex]?.reps ?? ''}</div>
                          </button>
                          <button onClick={() => setEditingField('weight')} disabled={workoutState === 'paused'} className="bg-gray-800 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              <label className="text-lg text-gray-400">Weight (kg)</label>
                              <div className="text-white text-5xl font-bold">{currentSets[currentSetIndex]?.weight ?? '--'}</div>
                          </button>
                      </div>
                  </div>
              )}
          </div>
        </main>
        
        <footer className="h-32 flex-shrink-0 flex items-center justify-center">
            {workoutState === 'working' && <button onClick={handleCompleteSet} className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center active:bg-green-600"><CheckIcon className="w-16 h-16 text-white" /></button>}
        </footer>
      </div>

      {confirmAction && (
        <BottomSheet
            isOpen={true}
            onClose={() => setConfirmAction(null)}
            title={`Confirm ${confirmAction === 'finish' ? 'Finish' : 'Cancel'}`}
            primaryAction={{
                label: "Confirm",
                onClick: handleConfirm
            }}
            secondaryAction={{
                label: "Go Back",
                onClick: () => setConfirmAction(null)
            }}
        >
            <div className="p-4 text-center">
                <p className="text-body">
                    Are you sure you want to {confirmAction} this workout? 
                    {confirmAction === 'cancel' && ' All progress will be lost.'}
                    {confirmAction === 'finish' && ' This will log your session to your history.'}
                </p>
            </div>
        </BottomSheet>
      )}

      {editingField && (
        <NumericInputPad
          initialValue={currentSets[currentSetIndex]?.[editingField] ?? ''}
          label={editingField}
          allowDecimal={editingField === 'weight'}
          onSave={(value) => {
            updateSet(editingField, value);
            setEditingField(null);
          }}
          onClose={() => setEditingField(null)}
        />
      )}
    </>
  );
};


const WorkoutHistoryDetail: React.FC<{
    entry: WorkoutSessionRecord;
    onBack: () => void;
}> = ({ entry, onBack }) => {
    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-4">
                <ChevronLeftIcon className="w-4 h-4" /> Back to History
            </button>
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white">{entry.planName}</h3>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(parseISO(entry.completedAt), 'EEEE, MMMM d, yyyy')}
                </p>
            </div>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                {entry.exercises.map((ex, exIndex) => (
                    <div key={exIndex} className="bg-white/5 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg text-white mb-2">{ex.name}</h4>
                        {ex.note && (
                            <p className="text-sm text-indigo-300 italic mb-4 p-2 bg-black/20 rounded-md">
                                Note: {ex.note}
                            </p>
                        )}
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/10">
                                    <th className="font-semibold p-2 w-1/4">Set</th>
                                    <th className="font-semibold p-2 w-1/3 text-center">Reps</th>
                                    <th className="font-semibold p-2 w-1/3 text-center">Weight (kg)</th>
                                    <th className="font-semibold p-2 text-center">Done</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ex.sets.map((set, setIndex) => (
                                    <tr key={setIndex} className={`border-b border-white/5 ${set.completed ? 'text-gray-200' : 'text-gray-400 opacity-70'}`}>
                                        <td className="font-bold p-2">#{setIndex + 1}</td>
                                        <td className="p-2 text-center">{set.reps}</td>
                                        <td className="p-2 text-center">{set.weight !== undefined ? set.weight : '–'}</td>
                                        <td className="p-2 text-center">
                                            {set.completed && <CheckIcon className="w-5 h-5 text-green-400 mx-auto" />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
};

const IntervalTimer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [settings, setSettings] = useState({ work: 45, rest: 15, sets: 8 });
    const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
    const [currentSet, setCurrentSet] = useState(1);
    const [isWorkPhase, setIsWorkPhase] = useState(true);
    const [remainingTime, setRemainingTime] = useState(settings.work);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<number | null>(null);

    const playSound = useCallback((type: 'work' | 'rest' | 'countdown' | 'finish') => {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current; if (ctx.state === 'suspended') ctx.resume();
        const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0, ctx.currentTime);
        switch (type) {
            case 'work': o.frequency.setValueAtTime(880, ctx.currentTime); g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2); break;
            case 'rest': o.frequency.setValueAtTime(440, ctx.currentTime); g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); break;
            case 'countdown': o.frequency.setValueAtTime(660, ctx.currentTime); g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1); break;
            case 'finish': o.frequency.setValueAtTime(1046.5, ctx.currentTime); g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); break;
        }
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 1);
    }, []);

    const vibrate = (pattern: number | number[]) => { if ('vibrate' in navigator) navigator.vibrate(pattern); };
    const resetTimer = useCallback((newSettings = settings) => { if (timerRef.current) clearInterval(timerRef.current); setStatus('idle'); setCurrentSet(1); setIsWorkPhase(true); setRemainingTime(newSettings.work); }, [settings]);

    useEffect(() => {
        if (status !== 'running') return;
        timerRef.current = window.setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    if (isWorkPhase) { playSound('rest'); vibrate(300); setIsWorkPhase(false); return settings.rest; }
                    else {
                        if (currentSet < settings.sets) { playSound('work'); vibrate([100, 50, 100]); setCurrentSet(s => s + 1); setIsWorkPhase(true); return settings.work; }
                        else { playSound('finish'); vibrate(500); setStatus('finished'); return 0; }
                    }
                }
                if(prev <= 4 && prev > 1) playSound('countdown');
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, settings, isWorkPhase, currentSet]);

    const handleSettingsChange = (field: keyof typeof settings, value: number) => { const newSettings = { ...settings, [field]: value }; setSettings(newSettings); resetTimer(newSettings); };
    const totalTime = isWorkPhase ? settings.work : settings.rest;
    const progress = totalTime > 0 ? (totalTime - remainingTime) / totalTime : 0;
    const phaseColor = isWorkPhase ? 'text-green-400' : 'text-blue-400';

    if (status !== 'idle') {
        return (
            <div className="fixed inset-0 bg-[#121212] z-50 flex flex-col items-center justify-between p-8">
                <div className="text-center"><p className={`text-6xl font-bold uppercase tracking-widest ${phaseColor}`}>{isWorkPhase ? 'Work' : 'Rest'}</p><p className="text-2xl text-gray-400">Set {currentSet} / {settings.sets}</p></div>
                <div className="relative w-72 h-72 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-700" /><circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={Math.PI * 108} strokeDashoffset={(Math.PI * 108) * (1 - progress)} className={`transition-all duration-500 ${phaseColor}`} /></svg>
                    <p className="text-8xl font-mono font-bold text-white">{remainingTime}</p>
                </div>
                <div className="flex items-center gap-4">
                    {status === 'finished' ? (<button onClick={() => resetTimer()} className="px-6 py-3 text-lg font-semibold rounded-lg bg-indigo-600 text-white">Restart</button>) : (<button onClick={() => setStatus(s => s === 'running' ? 'paused' : 'running')} className="px-6 py-3 text-lg font-semibold rounded-lg bg-indigo-600 text-white w-32">{status === 'running' ? 'Pause' : 'Resume'}</button>)}
                    <button onClick={() => resetTimer()} className="p-4 rounded-full bg-white/10 text-white"><RotateCcwIcon /></button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 p-4 text-gray-400 hover:text-white"><XIcon /></button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center p-4">
            <h3 className="text-lg font-semibold mb-6">Configure Timer</h3>
            <div className="w-full space-y-4">
                <div className="flex justify-between items-center"><label htmlFor="work-time" className="text-body-emphasis">Work Time (sec)</label><input id="work-time" type="number" value={settings.work} onChange={e => handleSettingsChange('work', parseInt(e.target.value) || 0)} className="w-24 bg-white/10 rounded p-2 text-center text-lg" /></div>
                <div className="flex justify-between items-center"><label htmlFor="rest-time" className="text-body-emphasis">Rest Time (sec)</label><input id="rest-time" type="number" value={settings.rest} onChange={e => handleSettingsChange('rest', parseInt(e.target.value) || 0)} className="w-24 bg-white/10 rounded p-2 text-center text-lg" /></div>
                <div className="flex justify-between items-center"><label htmlFor="sets-count" className="text-body-emphasis">Number of Sets</label><input id="sets-count" type="number" value={settings.sets} onChange={e => handleSettingsChange('sets', parseInt(e.target.value) || 0)} className="w-24 bg-white/10 rounded p-2 text-center text-lg" /></div>
            </div>
            <button onClick={() => setStatus('running')} className="mt-8 w-full p-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg transition flex items-center justify-center gap-2"><PlayIcon /> Start Timer</button>
        </div>
    );
};


export default WorkoutModule;