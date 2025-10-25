import React from 'react';

/**
 * Component responsible for displaying collection step progress
 * Single Responsibility: Step progress visualization
 */
const CollectionStepIndicator = ({ steps, currentStep, routeStarted }) => {
  return (
    <div className="w-64 bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-xl font-semibold mb-6">Collection Process</h2>
      {steps.map((step) => (
        <div
          key={step.id}
          className={`flex items-center gap-3 mb-4 p-3 rounded-lg transition-colors ${
            currentStep === step.id
              ? 'bg-green-500 text-white'
              : currentStep > step.id
              ? 'bg-gray-100 text-gray-700'
              : 'text-gray-400'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep === step.id ? 'bg-white text-green-500' : 'bg-gray-200'
          }`}>
            {step.id}
          </div>
          <span className="text-sm">{step.name}</span>
        </div>
      ))}
    </div>
  );
};

export default CollectionStepIndicator;
