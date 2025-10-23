import React, { useState, FormEvent } from 'react';
import Module from './Module';
import { 
    CalendarDaysIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    PencilIcon, 
    TrashIcon,
    CheckIcon,
    XIcon
} from './icons';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import BottomSheet from './BottomSheet';

interface CalendarEvent {
    id: number;
    text: string;
}

interface Events {
    [key: string]: CalendarEvent[];
}

const CalendarModule: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [justAddedEventId, setJustAddedEventId] = useState<number | null>(null);
    const [justUpdatedEventId, setJustUpdatedEventId] = useState<number | null>(null);
    
    const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


    const [events, setEvents] = useState<Events>({
        [format(new Date(), 'yyyy-MM-dd')]: [{ id: 1, text: "Life Sync project kickoff" }],
    });

    const [newEventText, setNewEventText] = useState('');
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(firstDayOfMonth),
        end: endOfWeek(lastDayOfMonth),
    });

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    
    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setIsModalOpen(true);
        setNewEventText('');
        setEditingEvent(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        // Delay resetting selectedDate to prevent content from disappearing during animation
        setTimeout(() => {
            setSelectedDate(null);
            setDeletingEventId(null);
        }, 300); 
    };

    const getEventKey = (date: Date) => format(date, 'yyyy-MM-dd');

    const handleAddEvent = (e: FormEvent) => {
        e.preventDefault();
        if (newEventText.trim() === '' || !selectedDate) return;

        const key = getEventKey(selectedDate);
        const newEventId = Date.now();
        const newEvent: CalendarEvent = { id: newEventId, text: newEventText };
        
        setEvents(prevEvents => ({
            ...prevEvents,
            [key]: [...(prevEvents[key] || []), newEvent],
        }));
        setNewEventText('');

        setJustAddedEventId(newEventId);
        setTimeout(() => setJustAddedEventId(null), 500);
    };
    
    const handleDeleteEvent = (eventId: number) => {
        setDeletingEventId(eventId);
        setTimeout(() => setShowDeleteConfirm(true), 10);
    };
    
    const confirmDelete = () => {
        if (!selectedDate || deletingEventId === null) return;

        const key = getEventKey(selectedDate);
        setEvents(prevEvents => {
            const updatedEventsForKey = (prevEvents[key] || []).filter(event => event.id !== deletingEventId);

            if (updatedEventsForKey.length > 0) {
                return {
                    ...prevEvents,
                    [key]: updatedEventsForKey,
                };
            } else {
                const newEvents = { ...prevEvents };
                delete newEvents[key];
                return newEvents;
            }
        });
        
        setShowDeleteConfirm(false);
        setTimeout(() => setDeletingEventId(null), 300);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setTimeout(() => setDeletingEventId(null), 300);
    };


    const handleStartEdit = (event: CalendarEvent) => {
        setEditingEvent(event);
    };

    const handleUpdateEvent = () => {
        if (!selectedDate || !editingEvent || editingEvent.text.trim() === '') return;

        const key = getEventKey(selectedDate);
        setEvents(prevEvents => ({
            ...prevEvents,
            [key]: prevEvents[key].map(event =>
                event.id === editingEvent.id ? editingEvent : event
            ),
        }));
        
        setJustUpdatedEventId(editingEvent.id);
        setTimeout(() => setJustUpdatedEventId(null), 1000);

        setEditingEvent(null);
    };

    const renderModalContent = () => {
        if (!selectedDate) return null;
        
        return (
            <div className="relative">
                <div className="flex-grow min-h-[10rem]">
                    {(events[getEventKey(selectedDate)] || []).length > 0 ? (
                        <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {events[getEventKey(selectedDate)].map(event => (
                            <li key={event.id} className={`group flex items-center justify-between bg-white/5 p-4 rounded-lg transition-all duration-300 hover:bg-white/10 
                                ${justAddedEventId === event.id ? 'item-enter-animation' : ''}
                                ${justUpdatedEventId === event.id ? 'flash-animation' : ''}
                            `}>
                                {editingEvent?.id === event.id ? (
                                    <div className="w-full flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editingEvent.text}
                                            onChange={(e) => setEditingEvent({ ...editingEvent, text: e.target.value })}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateEvent();
                                                if (e.key === 'Escape') setEditingEvent(null);
                                            }}
                                            className="flex-grow bg-slate-900/80 text-white placeholder-gray-400 border border-indigo-500/50 rounded-md px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition"
                                            aria-label="Edit event text"
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateEvent} className="p-2 rounded-full text-green-400 hover:bg-green-500/20 transition-colors" aria-label="Save event">
                                            <CheckIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setEditingEvent(null)} className="p-2 rounded-full text-gray-400 hover:bg-gray-500/20 transition-colors" aria-label="Cancel edit">
                                            <XIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-1 h-4 rounded-full bg-indigo-500 flex-shrink-0"></div>
                                            <span className="text-body">{event.text}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                            <button onClick={() => handleStartEdit(event)} className="p-2 rounded-full text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 transition-colors" aria-label={`Edit event: ${event.text}`}>
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteEvent(event.id)} className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors" aria-label={`Delete event: ${event.text}`}>
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8 text-gray-400 relative flex flex-col items-center justify-center h-full">
                            <div className="absolute inset-0 flex items-center justify-center -z-10">
                                <CalendarDaysIcon className="w-24 h-24 text-slate-800/50" />
                            </div>
                            <p className="text-body text-gray-400">No events for this day.</p>
                            <p className="text-caption mt-2">Add a new event below.</p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleAddEvent} className="mt-6 border-t border-white/10 pt-4 flex gap-2">
                    <input
                        type="text"
                        value={newEventText}
                        onChange={e => setNewEventText(e.target.value)}
                        placeholder="Add a new event..."
                        className="flex-grow bg-white/10 text-white placeholder-gray-400 border border-transparent rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        aria-label="New event text"
                    />
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition font-semibold">
                        Add
                    </button>
                </form>

                {deletingEventId !== null && (
                    <div className={`absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center p-4 rounded-lg transition-opacity duration-300 ${showDeleteConfirm ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className={`bg-slate-800 border border-white/10 rounded-lg p-6 shadow-xl text-center transform transition-all duration-300 ${showDeleteConfirm ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                            <h4 className="text-lg font-semibold text-white mb-2">Confirm Deletion</h4>
                            <p className="text-gray-300 mb-6">Are you sure you want to delete this event?</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={cancelDelete} className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition font-semibold">
                                    Cancel
                                </button>
                                <button onClick={confirmDelete} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-semibold">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <Module title="Calendar" icon={<CalendarDaysIcon />} className={className}>
                <div className="flex items-center justify-between mb-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-white/10 transition" aria-label="Previous month">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <h3 className="text-module-header w-48 text-center" aria-live="polite">
                        {format(currentDate, 'MMMM yyyy')}
                    </h3>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-white/10 transition" aria-label="Next month">
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-caption text-xs mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} aria-hidden="true">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map(day => {
                        const dayKey = getEventKey(day);
                        const hasEvents = events[dayKey] && events[dayKey].length > 0;
                        const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => handleDayClick(day)}
                                aria-label={`${format(day, 'MMMM d')}${hasEvents ? ' (has events)' : ''}`}
                                className={`
                                    relative w-full aspect-square flex items-center justify-center rounded-lg transition-all text-sm
                                    ${!isSameMonth(day, currentDate) ? 'text-gray-500' : 'text-gray-200 hover:bg-white/10'}
                                    ${isToday(day) && !isSelected ? 'bg-indigo-600/50 font-bold' : ''}
                                    ${isSelected ? 'bg-indigo-500 ring-2 ring-indigo-300 font-bold' : ''}
                                `}
                            >
                                <time dateTime={format(day, 'yyyy-MM-dd')}>{format(day, 'd')}</time>
                                {hasEvents && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-400 rounded-full" aria-hidden="true"></div>}
                            </button>
                        );
                    })}
                </div>
                {selectedDate && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <h3 className="text-module-header mb-2 px-2">
                            Events on {format(selectedDate, 'MMMM d')}
                        </h3>
                        {(events[getEventKey(selectedDate)] && events[getEventKey(selectedDate)].length > 0) ? (
                            <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                {events[getEventKey(selectedDate)].map(event => (
                                    <li key={event.id} className="flex items-center gap-4 bg-white/5 p-2 rounded-lg">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full flex-shrink-0" aria-hidden="true"></div>
                                        <span className="text-caption text-gray-200">{event.text}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-gray-400 text-center py-4">
                                <p className="text-body">No events for this day.</p>
                            </div>
                        )}
                    </div>
                )}
            </Module>
            
            {isModalOpen && selectedDate && (
                <BottomSheet
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={`Events for ${format(selectedDate, 'MMMM d, yyyy')}`}
                >
                    {renderModalContent()}
                </BottomSheet>
            )}
        </>
    );
};

export default CalendarModule;