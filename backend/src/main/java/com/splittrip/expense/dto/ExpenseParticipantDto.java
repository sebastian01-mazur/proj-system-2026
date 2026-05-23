package com.splittrip.expense.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseParticipantDto(

        UUID userId,

        BigDecimal shareAmount

) {
}