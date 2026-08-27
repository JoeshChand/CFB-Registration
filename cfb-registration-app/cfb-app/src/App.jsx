import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import AdminPage from "./AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RegisterPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
