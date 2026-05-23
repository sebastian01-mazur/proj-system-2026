package com.splittrip.expense.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RecentExpenseDto(
    UUID expenseId,
    UUID tripId,
    BigDecimal amount,
    String currency,
    LocalDate date,
    String categoryName
    ) {
}