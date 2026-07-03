/**
 * useActivePatient.ts
 * Stores active patient in localStorage.
 * Sidebar reads this — shows real patient name.
 * All pages use this to know which patient is selected.
 */

"use client";
import { useState, useEffect } from "react";

export type Patient = {
  id:         string;
  name:       string;
  age:        number;
  gender:     string;
  blood:      string;
  conditions: string[];
  meds:       string[];
  docs:       any[];
  memory_pct: number;
  alerts:     number;
};

const KEY = "medimem_active_patient";

export function useActivePatient() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setPatient(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const selectPatient = (p: Patient) => {
    localStorage.setItem(KEY, JSON.stringify(p));
    setPatient(p);
  };

  const clearPatient = () => {
    localStorage.removeItem(KEY);
    setPatient(null);
  };

  const refreshPatient = async (id: string) => {
    try {
      const { api } = await import("@/lib/api");
      const updated = await api.getPatient(id);
      localStorage.setItem(KEY, JSON.stringify(updated));
      setPatient(updated);
    } catch {}
  };

  return { patient, loading, selectPatient, clearPatient, refreshPatient };
}
