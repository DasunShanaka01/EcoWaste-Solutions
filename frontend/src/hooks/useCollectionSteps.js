import { useState } from 'react';

/**
 * Custom hook for managing collection step state and navigation
 * Single Responsibility: Step management and navigation logic
 */
export const useCollectionSteps = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [routeStarted, setRouteStarted] = useState(false);

  const steps = [
    { id: 1, name: 'Route Overview' },
    { id: 2, name: 'Scan Account Tag' },
    { id: 3, name: 'Verify Account' },
    { id: 4, name: 'Record Weight' },
    { id: 5, name: 'Confirm Collection' }
  ];

  const startRoute = () => {
    setRouteStarted(true);
    setCurrentStep(2);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepNumber) => {
    if (stepNumber >= 1 && stepNumber <= steps.length) {
      setCurrentStep(stepNumber);
    }
  };

  const resetSteps = () => {
    setCurrentStep(1);
    setRouteStarted(false);
  };

  return {
    currentStep,
    routeStarted,
    steps,
    startRoute,
    nextStep,
    prevStep,
    goToStep,
    resetSteps
  };
};
