import React from 'react';
import JournalModule from '../components/JournalModule';

const JournalPage: React.FC = () => {
    // These props might need to be passed down from App.tsx if needed
    return <JournalModule setIsFocusMode={() => {}} />;
};

export default JournalPage;
