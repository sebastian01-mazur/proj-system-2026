package com.splittrip.expense;

import com.splittrip.expense.dto.SettlementDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class ExpenseSettlementService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;

    public ExpenseSettlementService(
            ExpenseRepository expenseRepository,
            ExpenseSplitRepository expenseSplitRepository
    ) {
        this.expenseRepository = expenseRepository;
        this.expenseSplitRepository = expenseSplitRepository;
    }

    public List<SettlementDto> calculateTripSettlements(
            UUID tripId
    ) {

        List<Expense> expenses =
                expenseRepository.findByTripId(tripId);

                for (Expense expense : expenses) {
                        expense.setShares(expenseSplitRepository.findByExpenseId(expense.getId()));
                }

        Map<UUID, BigDecimal> balances =
                new HashMap<>();

        for (Expense expense : expenses) {

            UUID payerId =
                    expense.getPayerId();

            BigDecimal paidAmount =
                    expense.getConvertedAmount();

            balances.putIfAbsent(
                    payerId,
                    BigDecimal.ZERO
            );

            balances.put(
                    payerId,
                    balances.get(payerId)
                            .add(paidAmount)
            );

            for (ExpenseSplit split : expense.getShares()) {

                UUID userId =
                        split.getUserId();

                BigDecimal owed =
                        split.getShareAmount();

                balances.putIfAbsent(
                        userId,
                        BigDecimal.ZERO
                );

                balances.put(
                        userId,
                        balances.get(userId)
                                .subtract(owed)
                );
            }
        }

        return buildSettlements(balances);
    }

    private List<SettlementDto> buildSettlements(
            Map<UUID, BigDecimal> balances
    ) {

        List<SettlementDto> settlements =
                new ArrayList<>();

        List<Map.Entry<UUID, BigDecimal>> debtors =
                balances.entrySet()
                        .stream()
                        .filter(entry ->
                                entry.getValue()
                                        .compareTo(BigDecimal.ZERO) < 0)
                        .toList();

        List<Map.Entry<UUID, BigDecimal>> creditors =
                balances.entrySet()
                        .stream()
                        .filter(entry ->
                                entry.getValue()
                                        .compareTo(BigDecimal.ZERO) > 0)
                        .toList();

        for (Map.Entry<UUID, BigDecimal> debtor : debtors) {

            BigDecimal debt =
                    debtor.getValue().abs();

            for (Map.Entry<UUID, BigDecimal> creditor : creditors) {

                BigDecimal credit =
                        creditor.getValue();

                if (debt.compareTo(BigDecimal.ZERO) <= 0) {
                    break;
                }

                if (credit.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                BigDecimal transfer =
                        debt.min(credit);

                settlements.add(
                        new SettlementDto(
                                debtor.getKey(),
                                creditor.getKey(),
                                transfer
                        )
                );

                debt =
                        debt.subtract(transfer);

                creditor.setValue(
                        credit.subtract(transfer)
                );
            }
        }

        return settlements;
    }
}