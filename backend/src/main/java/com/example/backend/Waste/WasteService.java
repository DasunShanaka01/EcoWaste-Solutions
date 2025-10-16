package com.example.backend.Waste;

import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WasteService {

    // This is the repository that interacts with MongoDB
    private final WasteRepository wasteRepository;

    public List<Waste> findAll() {
        return wasteRepository.findAll();
    }

    // Optional: method to find waste by its ID
    public Optional<Waste> findById(ObjectId id) {
        return wasteRepository.findById(id);
    }

    // add waste
    public Waste save(String userId, String fullName, String phoneNumber, String email, String submissionMethod,
            String status, Waste.PickupDetails pickup,
            double totalWeightKg, double totalPaybackAmount, String paymentMethod,
            String paymentStatus, List<Waste.Item> items, String imageUrl, Waste.GeoLocation location) {
        Waste waste = new Waste();
        waste.setUserId(userId);
        waste.setFullName(fullName);
        waste.setPhoneNumber(phoneNumber);
        waste.setEmail(email);
        waste.setSubmissionMethod(submissionMethod);
        waste.setStatus(status);
        waste.setPickup(pickup);
        waste.setTotalWeightKg(totalWeightKg);
        waste.setTotalPaybackAmount(totalPaybackAmount);
        waste.setPaymentMethod(paymentMethod);
        waste.setPaymentStatus(paymentStatus);
        waste.setItems(items);
        waste.setImageUrl(imageUrl);
        waste.setLocation(location);
        waste.setSubmissionDate(java.time.LocalDateTime.now());
        return wasteRepository.save(waste);

    }

    public void deleteById(ObjectId id) {
        wasteRepository.deleteById(id);
    }

    public Waste update(Waste waste) {
        return wasteRepository.save(waste);
    }

    // Find all waste submissions by userId
    public List<Waste> findByUserId(String userId) {
        return wasteRepository.findByUserId(userId);
    }

    // Find waste submissions by userId ordered by submission date (newest first)
    public List<Waste> findByUserIdOrderBySubmissionDateDesc(String userId) {
        return wasteRepository.findByUserIdOrderBySubmissionDateDesc(userId);
    }

}
