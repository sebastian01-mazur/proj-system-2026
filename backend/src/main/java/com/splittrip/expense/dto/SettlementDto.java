package com.splittrip.expense.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SettlementDto(

        UUID debtorId,

        UUID creditorId,

        BigDecimal amount

) {
}