package com.splittrip.report;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ReportService {

    //Oblicza saldo (kto komu winien), generuje statystyki wykorzystania budżetu oraz porównuje wydatki planowane z rzeczywistym

    public ExpenseReportResponse getExpenseReport(UUID tripId) {
        return null;
    }

    public List<ParticipantReportResponse> getParticipantReport(UUID tripId) {
        return List.of();
    }

    public List<SettlementResponse> getSettlements(UUID tripId) {
        return List.of();
    }
}
