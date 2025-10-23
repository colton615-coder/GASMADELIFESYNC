import React from 'react';
import Dashboard from '../Components/Dashboard/Dashboard';

interface DashboardPageProps {
    setActiveModule: (module: string) => void;
    setJournalLink: (dateKey: string | null) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveModule, setJournalLink }) => {
    return <Dashboard setActiveModule={setActiveModule} setJournalLink={setJournalLink} />;
};

export default DashboardPage;
