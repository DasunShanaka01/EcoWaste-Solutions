import React from 'react';

export default function MultiStepWrapper({ step, children }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: 20, borderRadius: 10 }}>
      <h3>Registration — Step {step} of 2</h3>
      {children}
    </div>
  );
}
