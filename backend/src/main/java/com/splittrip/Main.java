package com.splittrip;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }

//    @Bean
//    CommandLineRunner verifyDatabaseConnection(TripRepository tripRepository) {
//        return args -> {
//            System.out.println("=== ROZPOCZYNAM WERYFIKACJĘ BAZY DANYCH ===");
//
//            // przykladowe dane
//            Trip newTrip = new Trip();
//            newTrip.setOrganizerId(UUID.randomUUID());
//            newTrip.setCountry("Włochy");
//            newTrip.setStartDate(LocalDate.of(2026, 7, 10));
//            newTrip.setEndDate(LocalDate.of(2026, 7, 20));
//            newTrip.setBaseCurrency("PLN");
//            newTrip.setPlannedBudget(new BigDecimal("5000.00"));
//            newTrip.setStatus(TripStatus.PLANNED);
//            newTrip.setCreatedAt(LocalDate.now());
//
//            //  Zapis do bazy danych
//            tripRepository.save(newTrip);
//            System.out.println("Zapisano podróż do bazy");
//
//            //  Odczyt z bazy danych
//            long count = tripRepository.count();
//            System.out.println("Liczba podróży w bazie danych: " + count);
//
//            System.out.println("=== WERYFIKACJA ZAKOŃCZONA SUKCESEM ===");
//        };
//    }
}