import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Disqualified = () => {
  const location = useLocation();
  const { reason } = location.state || { reason: 'You have been disqualified.' };

  // Function to block the back button
  useEffect(() => {
    const blockBackButton = () => {
      window.history.pushState(null, null, window.location.pathname);
    };

    // Prevent the default back navigation
    blockBackButton();
    window.addEventListener('popstate', blockBackButton);

    return () => {
      window.removeEventListener('popstate', blockBackButton);
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Disqualified</h1>
      <p>{reason}</p>
    </div>
  );
};

export default Disqualified;
