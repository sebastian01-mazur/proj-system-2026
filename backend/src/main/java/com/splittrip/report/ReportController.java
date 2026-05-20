package com.splittrip.report;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips/{tripId}")
public class ReportController {

    //Udostępnia raporty kategorii, szczegółowe zestawienia kosztów per uczestnik oraz końcowy bilans rozliczeń

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/reports/expenses")
    public ResponseEntity<ExpenseReportResponse> getExpenseReport(@PathVariable UUID tripId) {
        return ResponseEntity.ok(reportService.getExpenseReport(tripId));
    }

    @GetMapping("/reports/participants")
    public ResponseEntity<List<ParticipantReportResponse>> getParticipantReport(@PathVariable UUID tripId) {
        return ResponseEntity.ok(reportService.getParticipantReport(tripId));
    }

    @GetMapping("/settlements")
    public ResponseEntity<List<SettlementResponse>> getSettlements(@PathVariable UUID tripId) {
        return ResponseEntity.ok(reportService.getSettlements(tripId));
    }
}
