package com.splittrip.expense.dto;

import java.math.BigDecimal;

public record BudgetStatisticsDto(
    BigDecimal totalSpentInBaseCurrency,
    BigDecimal totalBudget,
    double budgetUtilizationPercentage
) {
}
