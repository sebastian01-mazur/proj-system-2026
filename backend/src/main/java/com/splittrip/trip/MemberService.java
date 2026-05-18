package com.splittrip.trip;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class MemberService {

    //Zarządza listą uczestników, wysyłaniem i akceptacją zaproszeń oraz przypisywaniem ról organizatora i uczestnika

    private final TripMemberRepository tripMemberRepository;
    private final InvitationRepository invitationRepository;
    private final TripRepository tripRepository;

    public MemberService(TripMemberRepository tripMemberRepository,
                         InvitationRepository invitationRepository,
                         TripRepository tripRepository) {
        this.tripMemberRepository = tripMemberRepository;
        this.invitationRepository = invitationRepository;
        this.tripRepository = tripRepository;
    }

    public List<TripMember> getTripMembers(UUID tripId) {
        return tripMemberRepository.findByIdTripId(tripId);
    }

    @Transactional
    public void assignRole(UUID tripId, UUID userId, Roles role) {
        TripMemberId id = new TripMemberId(tripId, userId);
        TripMember member = tripMemberRepository.findById(id)
                .orElse(new TripMember(id, role, LocalDate.now()));
        member.setRole(role);
        tripMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(UUID tripId, UUID userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (trip.getStatus() != TripStatus.PLANNED) {
            throw new RuntimeException("Cannot remove member after trip has started");
        }

        TripMemberId id = new TripMemberId(tripId, userId);
        tripMemberRepository.deleteById(id);
    }

    @Transactional
    public Invitation inviteUser(UUID tripId, UUID inviterId, UUID inviteeId) {
        invitationRepository.findByTripIdAndInviteeId(tripId, inviteeId)
                .ifPresent(inv -> { throw new RuntimeException("Invitation already exists"); });

        tripMemberRepository.findByIdTripIdAndIdUserId(tripId, inviteeId)
                .ifPresent(mem -> { throw new RuntimeException("User is already a member"); });

        Invitation invitation = new Invitation(tripId, inviteeId, inviterId, InvitationStatus.AWAITING, LocalDate.now());
        return invitationRepository.save(invitation);
    }

    public List<Invitation> getPendingInvitations(UUID inviteeId) {
        return invitationRepository.findByInviteeIdAndStatus(inviteeId, InvitationStatus.AWAITING);
    }

    @Transactional
    public void resolveInvitation(UUID invitationId, boolean accept) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (accept) {
            invitation.setStatus(InvitationStatus.ACCEPTED);
            invitation.setRespondedAt(LocalDate.now());

            TripMemberId memberId = new TripMemberId(invitation.getTripId(), invitation.getInviteeId());
            TripMember newMember = new TripMember(memberId, Roles.PARTICIPANT, LocalDate.now());
            tripMemberRepository.save(newMember);
        } else {
            invitation.setStatus(InvitationStatus.DECLINED);
            invitation.setRespondedAt(LocalDate.now());
        }
        invitationRepository.save(invitation);
    }

    public List<UUID> getUserTripIds(UUID userId) {
        return tripMemberRepository.findByIdUserId(userId).stream()
                .map(member -> member.getId().getTripId())
                .toList();
    }

}
