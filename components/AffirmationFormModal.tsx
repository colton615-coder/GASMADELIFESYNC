import React, { useState } from 'react';
import BottomSheet from './BottomSheet';

export interface Affirmation {
  id: string;
  text: string;
}

interface AffirmationFormModalProps {
    onSave: (text: string) => void;
    onClose: () => void;
    initialAffirmation: Affirmation | null;
}

const AffirmationFormModal: React.FC<AffirmationFormModalProps> = ({ onSave, onClose, initialAffirmation }) => {
    const [text, setText] = useState(initialAffirmation?.text || '');
    const isEditing = !!initialAffirmation;

    const handleSave = () => {
        if (text.trim()) {
            onSave(text.trim());
            onClose();
        }
    };

    return (
        <BottomSheet
            isOpen={true}
            onClose={onClose}
            title={isEditing ? 'Edit Affirmation' : 'New Affirmation'}
            primaryAction={{ label: 'Save', onClick: handleSave }}
            secondaryAction={{ label: 'Cancel', onClick: onClose }}
        >
            <div className="p-4">
                <label htmlFor="affirmation-textarea" className="sr-only">Affirmation text</label>
                <textarea id="affirmation-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g., I am confident and capable." className="w-full h-28 bg-white/10 text-white placeholder-gray-400 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition" autoFocus />
            </div>
        </BottomSheet>
    );
};

export default AffirmationFormModal;
