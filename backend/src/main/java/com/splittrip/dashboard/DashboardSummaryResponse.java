package com.splittrip.dashboard;

import com.splittrip.trip.Invitation;
import com.splittrip.trip.Trip;

import java.util.List;

public record DashboardSummaryResponse(
        List<Trip> activeTrips,
        List<Invitation> pendingInvitations
) {}

