import React from 'react';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" />;
    }

    return (<>
 SAlaam
    </>
    );
};

export default Dashboard;