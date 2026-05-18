package com.splittrip.dashboard;

import com.splittrip.trip.Invitation;
import com.splittrip.trip.MemberService;
import com.splittrip.trip.Trip;
import com.splittrip.trip.TripService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class DashboardService {
    private final TripService tripService;
    private final MemberService memberService;

    public DashboardService(TripService tripService, MemberService memberService) {
        this.tripService = tripService;
        this.memberService = memberService;
    }

    public DashboardSummaryResponse getSummaryForUser(UUID userId) {
        List<Trip> activeTrips = tripService.getTripsByOrganizer(userId);

        List<Invitation> pendingInvitations = memberService.getPendingInvitations(userId);

        return new DashboardSummaryResponse(activeTrips, pendingInvitations);
    }
}
