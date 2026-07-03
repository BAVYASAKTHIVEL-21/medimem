"use client";
import { useState, useEffect } from "react";

export type Doctor = {
  name:           string;
  specialisation: string;
  initials:       string;
};

const DOCTOR_KEY  = "medimem_doctor";
const PATIENT_KEY = "medimem_active_patient";

export function useAuth() {
  const [doctor,  setDoctor]  = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DOCTOR_KEY);
      if (saved) setDoctor(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const login = (name: string, specialisation: string) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const doc: Doctor = { name, specialisation, initials };
    localStorage.setItem(DOCTOR_KEY, JSON.stringify(doc));
    setDoctor(doc);
  };

  const logout = () => {
    localStorage.removeItem(DOCTOR_KEY);
    localStorage.removeItem(PATIENT_KEY);
    setDoctor(null);
    window.location.href = "/login";
  };

  const isLoggedIn = !!doctor;

  return { doctor, loading, login, logout, isLoggedIn };
}
