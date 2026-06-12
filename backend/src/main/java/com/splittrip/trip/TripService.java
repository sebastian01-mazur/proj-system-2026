package com.splittrip.trip;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class TripService {

    //Odpowiada za tworzenie i pobieranie danych podróży, walidację zakresów dat oraz zmianę stanów (np. z PLANNED na IN_PROGRESS)

    private final TripRepository tripRepository;
    private final MemberService memberService;

    public TripService(TripRepository tripRepository, MemberService memberService) {
        this.tripRepository = tripRepository;
        this.memberService = memberService;
    }

    @Transactional
    public Trip createTrip(Trip trip, UUID organizerId) {
        trip.setStatus(TripStatus.PLANNED);
        trip.setCreatedAt(LocalDate.now());
        trip.setOrganizerId(organizerId);
        Trip savedTrip = tripRepository.save(trip);

        // Automatyczne przypisanie twórcy jako głównego organizatora
        memberService.assignRole(savedTrip.getId(), savedTrip.getOrganizerId(), Roles.ORGANIZER);

        return savedTrip;
    }

    public List<Trip> getTripsByOrganizer(UUID organizerId) {
        return tripRepository.findByOrganizerId(organizerId);
    }

    public Trip getTripById(UUID tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));
    }

    @Transactional
    public Trip updateTripStatus(UUID tripId, TripStatus newStatus) {
        Trip trip = getTripById(tripId);
        trip.setStatus(newStatus);
        return tripRepository.save(trip);
    }

    public List<Trip> getUserTrips(UUID userId) {
        List<UUID> tripIds = memberService.getUserTripIds(userId);
        return tripRepository.findAllById(tripIds);
    }

}
