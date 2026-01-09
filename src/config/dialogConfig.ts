// Dialog configuration settings
export const dialogConfig = {
  // Common dialog settings
  closeOnOutsideClick: false,

  // Doctor dialog settings
  doctorDialog: {
    initialWidth: 800,
    initialHeight: 90,
    minWidth: 600,
    minHeight: 400,
    closeOnOutsideClick: false,
  },

  // Other dialog settings can be added here
  // staffDialog: { ... },
  // patientDialog: { ... },
} as const;
