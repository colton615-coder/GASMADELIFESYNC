import React, { useState, FormEvent, useMemo } from 'react';
import Module from './Module';
import { FlagIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, CalendarIcon } from './icons';
import usePersistentState from '../hooks/usePersistentState';
import WheelPicker from './WheelPicker';
import { format, parseISO, isValid } from 'date-fns';
import AnimatedCheckbox from './AnimatedCheckbox';
import BottomSheet from './BottomSheet';

type Priority = 'None' | 'Low' | 'Medium' | 'High';

interface Milestone {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string | null;
  targetDate?: string | null;
  priority?: Priority;
}

const priorityOrder: Record<Priority, number> = {
  'High': 3,
  'Medium': 2,
  'Low': 1,
  'None': 0,
};

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case 'High': return 'text-red-400';
    case 'Medium': return 'text-yellow-400';
    case 'Low': return 'text-blue-400';
    default: return 'text-gray-400';
  }
};

const MilestonesModule: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [milestones, setMilestones] = usePersistentState<Milestone[]>('milestones', []);
  
  // New Milestone state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
  const [newTargetDate, setNewTargetDate] = useState<string | null>(null);
  const [newPriority, setNewPriority] = useState<Priority>('None');

  // Editing state
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
  const [editingMilestoneTitle, setEditingMilestoneTitle] = useState('');
  const [editingMilestoneDescription, setEditingMilestoneDescription] = useState('');
  const [editingMilestoneTargetDate, setEditingMilestoneTargetDate] = useState<string | null>('');
  const [editingMilestonePriority, setEditingMilestonePriority] = useState<Priority>('None');

  // UI state
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<number | null>(null);
  const [justAddedMilestoneId, setJustAddedMilestoneId] = useState<number | null>(null);
  const [justCompletedMilestoneId, setJustCompletedMilestoneId] = useState<number | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerInitialValue, setPickerInitialValue] = useState<string | null>(null);
  const [datePickerCallback, setDatePickerCallback] = useState<(date: string | null) => void>(() => {});

  const openDatePicker = (currentValue: string | null, onSave: (newValue: string | null) => void) => {
    setPickerInitialValue(currentValue);
    setDatePickerCallback(() => onSave);
    setIsDatePickerOpen(true);
  };

  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => {
      // Incomplete milestones come first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Sort by priority for incomplete milestones
      if (!a.completed && !b.completed) {
        const priorityDiff = priorityOrder[b.priority || 'None'] - priorityOrder[a.priority || 'None'];
        if (priorityDiff !== 0) return priorityDiff;
      }

      // Then by target date
      if (a.targetDate && b.targetDate) {
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      }
      if (a.targetDate) return -1;
      if (b.targetDate) return 1;

      return 0;
    });
  }, [milestones]);

  const handleAddMilestone = (e: FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const newMilestone: Milestone = {
      id: Date.now(),
      title: newMilestoneTitle.trim(),
      description: newMilestoneDescription.trim(),
      completed: false,
      targetDate: newTargetDate,
      priority: newPriority,
    };

    setMilestones([newMilestone, ...milestones]);
    setJustAddedMilestoneId(newMilestone.id);
    setTimeout(() => setJustAddedMilestoneId(null), 500);

    // Reset form
    setNewMilestoneTitle('');
    setNewMilestoneDescription('');
    setNewTargetDate(null);
    setNewPriority('None');
  };

  const handleToggleComplete = (id: number) => {
    setMilestones(
      milestones.map(m =>
        m.id === id ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null } : m
      )
    );
    if (!milestones.find(m => m.id === id)?.completed) {
      setJustCompletedMilestoneId(id);
      setTimeout(() => setJustCompletedMilestoneId(null), 600);
    }
  };

  const handleStartEdit = (milestone: Milestone) => {
    setEditingMilestoneId(milestone.id);
    setEditingMilestoneTitle(milestone.title);
    setEditingMilestoneDescription(milestone.description || '');
    setEditingMilestoneTargetDate(milestone.targetDate || null);
    setEditingMilestonePriority(milestone.priority || 'None');
  };

  const handleSaveEdit = () => {
    if (!editingMilestoneTitle.trim()) return;

    setMilestones(
      milestones.map(m =>
        m.id === editingMilestoneId
          ? { ...m, title: editingMilestoneTitle.trim(), description: editingMilestoneDescription.trim(), targetDate: editingMilestoneTargetDate, priority: editingMilestonePriority }
          : m
      )
    );
    setEditingMilestoneId(null);
  };

  const handleCancelEdit = () => {
    setEditingMilestoneId(null);
  };

  const handleDeleteMilestone = (id: number) => {
    setDeletingMilestoneId(id);
    setTimeout(() => {
      setMilestones(milestones.filter(m => m.id !== id));
      setDeletingMilestoneId(null);
    }, 300);
  };

  const formatDateShort = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return null;
      return format(date, 'MMM d, yyyy');
    } catch {
      return null;
    }
  };

  const activeMilestones = sortedMilestones.filter(m => !m.completed);
  const completedMilestones = sortedMilestones.filter(m => m.completed);

  return (
    <Module title="Milestones" icon={<FlagIcon />} className={className}>
      <form onSubmit={handleAddMilestone} className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Milestone title"
          value={newMilestoneTitle}
          onChange={(e) => setNewMilestoneTitle(e.target.value)}
          className="w-full bg-white/5 text-white placeholder-gray-400 border border-transparent rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        />
        <textarea
          placeholder="Description (optional)"
          value={newMilestoneDescription}
          onChange={(e) => setNewMilestoneDescription(e.target.value)}
          className="w-full bg-white/5 text-white placeholder-gray-400 border border-transparent rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
          rows={2}
        />
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => openDatePicker(newTargetDate, setNewTargetDate)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition"
          >
            <CalendarIcon className="w-4 h-4" />
            {newTargetDate ? formatDateShort(newTargetDate) : 'Target Date'}
          </button>
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            className="px-3 py-2 text-sm bg-white/5 text-gray-300 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          >
            <option value="None">Priority: None</option>
            <option value="Low">Priority: Low</option>
            <option value="Medium">Priority: Medium</option>
            <option value="High">Priority: High</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg transition font-semibold active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          Add Milestone
        </button>
      </form>

      {/* Active Milestones */}
      {activeMilestones.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Active Milestones</h3>
          <ul className="space-y-2">
            {activeMilestones.map((milestone) => (
              <li
                key={milestone.id}
                className={`bg-white/5 rounded-lg p-4 transition-all duration-300 ${
                  deletingMilestoneId === milestone.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                } ${justAddedMilestoneId === milestone.id ? 'ring-2 ring-indigo-400' : ''} ${
                  justCompletedMilestoneId === milestone.id ? 'bg-green-500/20' : ''
                }`}
              >
                {editingMilestoneId === milestone.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingMilestoneTitle}
                      onChange={(e) => setEditingMilestoneTitle(e.target.value)}
                      className="w-full bg-black/30 text-white placeholder-gray-400 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    />
                    <textarea
                      value={editingMilestoneDescription}
                      onChange={(e) => setEditingMilestoneDescription(e.target.value)}
                      placeholder="Description"
                      className="w-full bg-black/30 text-white placeholder-gray-400 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
                      rows={2}
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => openDatePicker(editingMilestoneTargetDate, setEditingMilestoneTargetDate)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-black/30 hover:bg-black/50 text-gray-300 rounded transition"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        {editingMilestoneTargetDate ? formatDateShort(editingMilestoneTargetDate) : 'Target Date'}
                      </button>
                      <select
                        value={editingMilestonePriority}
                        onChange={(e) => setEditingMilestonePriority(e.target.value as Priority)}
                        className="px-3 py-2 text-sm bg-black/30 text-gray-300 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      >
                        <option value="None">Priority: None</option>
                        <option value="Low">Priority: Low</option>
                        <option value="Medium">Priority: Medium</option>
                        <option value="High">Priority: High</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <AnimatedCheckbox
                      checked={milestone.completed}
                      onChange={() => handleToggleComplete(milestone.id)}
                      className="mt-1"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-white break-words">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-sm text-gray-400 mt-1 break-words">{milestone.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        {milestone.targetDate && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                            <CalendarIcon className="w-3 h-3 inline mr-1" />
                            {formatDateShort(milestone.targetDate)}
                          </span>
                        )}
                        {milestone.priority && milestone.priority !== 'None' && (
                          <span className={`px-2 py-1 bg-white/10 rounded ${getPriorityColor(milestone.priority)}`}>
                            {milestone.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleStartEdit(milestone)}
                        className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded transition"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Completed Milestones */}
      {completedMilestones.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Completed Milestones</h3>
          <ul className="space-y-2 opacity-60">
            {completedMilestones.map((milestone) => (
              <li
                key={milestone.id}
                className={`bg-white/5 rounded-lg p-4 transition-all duration-300 ${
                  deletingMilestoneId === milestone.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AnimatedCheckbox
                    checked={milestone.completed}
                    onChange={() => handleToggleComplete(milestone.id)}
                    className="mt-1"
                  />
                  <div className="flex-grow min-w-0">
                    <h4 className="font-semibold text-white line-through break-words">{milestone.title}</h4>
                    {milestone.description && (
                      <p className="text-sm text-gray-400 mt-1 line-through break-words">{milestone.description}</p>
                    )}
                    {milestone.completedAt && (
                      <p className="text-xs text-green-400 mt-2">
                        Completed: {formatDateShort(milestone.completedAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded transition flex-shrink-0"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {milestones.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FlagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No milestones yet.</p>
          <p className="text-sm mt-1">Add your first milestone to start tracking your progress!</p>
        </div>
      )}

      <BottomSheet
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        title="Select Target Date"
      >
        <WheelPicker
          initialValue={pickerInitialValue}
          onSave={(newValue) => {
            datePickerCallback(newValue);
            setIsDatePickerOpen(false);
          }}
          onCancel={() => setIsDatePickerOpen(false)}
        />
      </BottomSheet>
    </Module>
  );
};

export default MilestonesModule;
