// Test script to create sample patient registration records
// Run this with: node test-patient-data.js

const testPatients = [
  {
    PatientName: "John Smith",
    PhoneNo: "9876543210",
    Gender: "Male",
    Age: 35,
    Address: "123 Main Street, City, State 12345",
    ChiefComplaint: "Fever and headache",
    Description: "Patient reports high fever and severe headache for 3 days"
  },
  {
    PatientName: "Sarah Johnson",
    PhoneNo: "9876543211",
    Gender: "Female",
    Age: 28,
    Address: "456 Oak Avenue, Town, State 67890",
    ChiefComplaint: "Chest pain",
    Description: "Sharp chest pain on left side, difficulty breathing"
  },
  {
    PatientName: "Michael Brown",
    PhoneNo: "9876543212",
    Gender: "Male",
    Age: 42,
    Address: "789 Pine Road, Village, State 54321",
    ChiefComplaint: "Back pain",
    Description: "Lower back pain radiating to legs, started after lifting heavy object"
  },
  {
    PatientName: "Emily Davis",
    PhoneNo: "9876543213",
    Gender: "Female",
    Age: 31,
    Address: "321 Elm Street, County, State 98765",
    ChiefComplaint: "Cough and cold",
    Description: "Persistent cough with nasal congestion for a week"
  },
  {
    PatientName: "David Wilson",
    PhoneNo: "9876543214",
    Gender: "Male",
    Age: 55,
    Address: "654 Maple Drive, District, State 13579",
    ChiefComplaint: "Joint pain",
    Description: "Pain in multiple joints, worse in mornings"
  },
  {
    PatientName: "Lisa Anderson",
    PhoneNo: "9876543215",
    Gender: "Female",
    Age: 24,
    Address: "987 Cedar Lane, Borough, State 24680",
    ChiefComplaint: "Stomach ache",
    Description: "Severe abdominal pain with nausea and vomiting"
  },
  {
    PatientName: "Robert Taylor",
    PhoneNo: "9876543216",
    Gender: "Male",
    Age: 67,
    Address: "147 Birch Boulevard, Province, State 86420",
    ChiefComplaint: "Shortness of breath",
    Description: "Difficulty breathing, especially at night"
  },
  {
    PatientName: "Jennifer Martinez",
    PhoneNo: "9876543217",
    Gender: "Female",
    Age: 39,
    Address: "258 Spruce Court, Territory, State 97531",
    ChiefComplaint: "Headache",
    Description: "Chronic headaches with sensitivity to light"
  }
];

async function createTestPatients() {
  const API_BASE_URL = 'http://localhost:5000/api'; // Adjust this to your backend URL

  console.log('Creating test patient records...\n');

  for (let i = 0; i < testPatients.length; i++) {
    const patient = testPatients[i];

    try {
      console.log(`Creating patient ${i + 1}/${testPatients.length}: ${patient.PatientName}`);

      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patient)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ Failed to create patient ${patient.PatientName}:`, errorData);
        continue;
      }

      const result = await response.json();
      console.log(`✅ Successfully created patient: ${result.PatientName || result.patientName} (ID: ${result.PatientId || result.patientId})`);

    } catch (error) {
      console.error(`❌ Error creating patient ${patient.PatientName}:`, error.message);
    }

    // Small delay between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 Test patient creation completed!');
  console.log('You can now test the Patient Registration screen with these records.');
}

// Run the script
createTestPatients().catch(console.error);
