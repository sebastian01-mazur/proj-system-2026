import { apiRequest } from "./apiConfig";

export async function getExpenseReport(tripId) {
  return apiRequest(`/trips/${tripId}/reports/expenses`, {
    method: "GET",
  });
}

export async function getParticipantReport(tripId) {
  const report = await apiRequest(`/trips/${tripId}/reports/participants`, {
    method: "GET",
  });

  return Array.isArray(report) ? report : [];
}

export async function getReportSettlements(tripId) {
  const settlements = await apiRequest(`/trips/${tripId}/settlements`, {
    method: "GET",
  });

  return Array.isArray(settlements) ? settlements : [];
}