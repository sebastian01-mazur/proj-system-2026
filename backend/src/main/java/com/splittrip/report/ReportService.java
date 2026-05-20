package com.splittrip.report;

import com.splittrip.expense.Expense;
import com.splittrip.trip.Trip;
import com.splittrip.trip.TripRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReportService {

    //Oblicza saldo (kto komu winien), generuje statystyki wykorzystania budżetu oraz porównuje wydatki planowane z rzeczywistym

    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;

    public ReportService(ExpenseRepository expenseRepository, TripRepository tripRepository) {
        this.expenseRepository = expenseRepository;
        this.tripRepository = tripRepository;
    }

    public ExpenseReportResponse getExpenseReport(UUID tripId) {
        List<Expense> expenses = expenseRepository.findByTripId(tripId);
        Trip trip = tripRepository.findById(tripId).orElseThrow();

        BigDecimal totalSpent = expenses.stream()
                .map(Expense::getConvertedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> spentByCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getConvertedAmount, BigDecimal::add)
                ));

        double utilizationPercentage = 0.0;
        if (trip.getPlannedBudget() != null && trip.getPlannedBudget().compareTo(BigDecimal.ZERO) > 0) {
            utilizationPercentage = totalSpent.doubleValue() / trip.getPlannedBudget().doubleValue() * 100;
        }

        return new ExpenseReportResponse(totalSpent, trip.getPlannedBudget(), spentByCategory, utilizationPercentage);
    }

    public List<ParticipantReportResponse> getParticipantReport(UUID tripId) {
        List<Expense> expenses = expenseRepository.findByTripId(tripId);
        Map<UUID, ParticipantReportResponse> participantReports = new HashMap<>();

        for (Expense expense : expenses) {
            UUID payerId = expense.getPayerId();
            participantReports.putIfAbsent(payerId, new ParticipantReportResponse(payerId, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
            ParticipantReportResponse payerReport = participantReports.get(payerId);

            participantReports.put(payerId, new ParticipantReportResponse(
                    payerId,
                    payerReport.amountPaid().add(expense.getConvertedAmount()),
                    payerReport.amountAssigned(),
                    BigDecimal.ZERO
            ));

            for (ExpenseShare share : expense.getShares()) {
                UUID participantId = share.getUserId();
                participantReports.putIfAbsent(participantId, new ParticipantReportResponse(participantId, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
                ParticipantReportResponse shareReport = participantReports.get(participantId);

                participantReports.put(participantId, new ParticipantReportResponse(
                        participantId,
                        shareReport.amountPaid(),
                        shareReport.amountAssigned().add(share.getShareAmount()),
                        BigDecimal.ZERO
                ));
            }
        }

        return participantReports.values().stream()
                .map(r -> new ParticipantReportResponse(
                        r.participantId(),
                        r.amountPaid(),
                        r.amountAssigned(),
                        r.amountPaid().subtract(r.amountAssigned())
                ))
                .toList();
    }

    public List<SettlementResponse> getSettlements(UUID tripId) {
        List<ParticipantReportResponse> reports = getParticipantReport(tripId);

        class ParticipantBalance {
            UUID userId;
            BigDecimal balance;

            ParticipantBalance(UUID userId, BigDecimal balance) {
                this.userId = userId;
                this.balance = balance;
            }
        }

        List<ParticipantBalance> balances = reports.stream()
                .filter(r -> r.balance().compareTo(BigDecimal.ZERO) != 0)
                .map(r -> new ParticipantBalance(r.participantId(), r.balance()))
                .collect(java.util.stream.Collectors.toList());

        List<SettlementResponse> settlements = new java.util.ArrayList<>();

        while (!balances.isEmpty()) {
            balances.sort(java.util.Comparator.comparing(b -> b.balance));

            ParticipantBalance debtor = balances.get(0);
            ParticipantBalance creditor = balances.get(balances.size() - 1);

            if (debtor.balance.compareTo(BigDecimal.ZERO) >= 0 || creditor.balance.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            BigDecimal debt = debtor.balance.abs();
            BigDecimal credit = creditor.balance;
            BigDecimal settledAmount = debt.min(credit);

            settlements.add(new SettlementResponse(debtor.userId, creditor.userId, settledAmount));

            debtor.balance = debtor.balance.add(settledAmount);
            creditor.balance = creditor.balance.subtract(settledAmount);

            balances.removeIf(b -> b.balance.abs().compareTo(new BigDecimal("0.01")) < 0);
        }

        return settlements;
    }
}
