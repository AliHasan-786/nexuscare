-- Schema for Nexus CareSight (Curana Health Portfolio Project)

-- Table 1: Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  base_risk_score INTEGER NOT NULL DEFAULT 0,
  current_risk_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('stable', 'monitoring', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Shift Notes (Unstructured raw data)
CREATE TABLE shift_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_text TEXT NOT NULL,
  ai_processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Standardized Assessments (Extracted JSON-like data)
CREATE TABLE standardized_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES shift_notes(id) ON DELETE CASCADE,
  cognitive_flag BOOLEAN NOT NULL DEFAULT FALSE,
  appetite_flag BOOLEAN NOT NULL DEFAULT FALSE,
  mobility_flag BOOLEAN NOT NULL DEFAULT FALSE,
  calculated_risk_delta INTEGER NOT NULL DEFAULT 0,
  clinical_evidence TEXT NOT NULL,
  analytical_rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_modtime
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
