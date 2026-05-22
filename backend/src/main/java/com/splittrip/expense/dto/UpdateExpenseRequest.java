package com.splittrip.expense.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;

public record UpdateExpenseRequest(

        UUID payerId,

        UUID categoryId,

        BigDecimal amount,

        String currency,

        String description,

        LocalDate expenseDate,

        List<ExpenseParticipantDto> participants

) {
}