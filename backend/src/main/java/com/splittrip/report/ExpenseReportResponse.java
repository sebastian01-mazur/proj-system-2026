package com.splittrip.report;

import java.math.BigDecimal;
import java.util.Map;

public record ExpenseReportResponse(
        BigDecimal totalSpent,
        BigDecimal totalBudget,
        Map<String, BigDecimal> spentByCategory,
        double budgetUtilizationPercentage
) {
}
