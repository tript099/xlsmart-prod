import React from 'react';

export const AIJobDescriptionsIntelligenceDebug: React.FC = () => {
  console.log('🔥 DEBUG: Simple component rendering');
  
  return (
    <div className="p-4 border border-green-500 bg-green-50">
      <h3 className="text-lg font-bold">Debug Component</h3>
      <p>If you can see this, React rendering is working.</p>
      <p>The original component has an error preventing it from rendering.</p>
    </div>
  );
};