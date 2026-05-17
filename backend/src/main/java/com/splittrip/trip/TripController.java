package com.splittrip.trip;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    //Udostępnia endpointy do tworzenia podróży, edycji statusów, zarządzania uczestnikami oraz obsługi zaproszeń

    private final TripService tripService;
    private final MemberService memberService;

    public TripController(TripService tripService, MemberService memberService) {
        this.tripService = tripService;
        this.memberService = memberService;
    }

    public record CreateTripRequest(UUID organizerId, String country, LocalDate startDate, LocalDate endDate, String baseCurrency, BigDecimal plannedBudget) {}
    public record UpdateStatusRequest(TripStatus status) {}
    public record InviteRequest(UUID inviterId, UUID inviteeId) {}
    public record ResolveInvitationRequest(boolean accept) {}
    public record UpdateRoleRequest(Roles role) {}


    @PostMapping
    public ResponseEntity<Trip> createTrip(@RequestBody CreateTripRequest request) {
        Trip newTrip = new Trip(
                request.organizerId(), request.country(), request.startDate(), request.endDate(),
                request.baseCurrency(), request.plannedBudget(), TripStatus.PLANNED, LocalDate.now()
        );
        return new ResponseEntity<>(tripService.createTrip(newTrip), HttpStatus.CREATED);
    }

    @GetMapping("/organizer/{organizerId}")
    public ResponseEntity<List<Trip>> getTripsByOrganizer(@PathVariable UUID organizerId) {
        return ResponseEntity.ok(tripService.getTripsByOrganizer(organizerId));
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<Trip> getTripDetails(@PathVariable UUID tripId) {
        return ResponseEntity.ok(tripService.getTripById(tripId));
    }

    @PatchMapping("/{tripId}/status")
    public ResponseEntity<Trip> updateTripStatus(@PathVariable UUID tripId, @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(tripService.updateTripStatus(tripId, request.status()));
    }

    @GetMapping("/{tripId}/members")
    public ResponseEntity<List<TripMember>> getTripMembers(@PathVariable UUID tripId) {
        return ResponseEntity.ok(memberService.getTripMembers(tripId));
    }

    @PatchMapping("/{tripId}/members/{userId}/role")
    public ResponseEntity<Void> updateMemberRole(@PathVariable UUID tripId, @PathVariable UUID userId, @RequestBody UpdateRoleRequest request) {
        memberService.assignRole(tripId, userId, request.role());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{tripId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID tripId, @PathVariable UUID userId) {
        memberService.removeMember(tripId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{tripId}/invitations")
    public ResponseEntity<Invitation> inviteUser(@PathVariable UUID tripId, @RequestBody InviteRequest request) {
        return new ResponseEntity<>(memberService.inviteUser(tripId, request.inviterId(), request.inviteeId()), HttpStatus.CREATED);
    }

    @GetMapping("/invitations/pending/{inviteeId}")
    public ResponseEntity<List<Invitation>> getPendingInvitations(@PathVariable UUID inviteeId) {
        return ResponseEntity.ok(memberService.getPendingInvitations(inviteeId));
    }

    @PatchMapping("/invitations/{invitationId}/resolve")
    public ResponseEntity<Void> resolveInvitation(@PathVariable UUID invitationId, @RequestBody ResolveInvitationRequest request) {
        memberService.resolveInvitation(invitationId, request.accept());
        return ResponseEntity.ok().build();
    }

}
