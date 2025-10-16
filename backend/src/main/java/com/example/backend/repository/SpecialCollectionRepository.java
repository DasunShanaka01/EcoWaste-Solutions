package com.example.backend.repository;

import com.example.backend.model.SpecialCollection;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SpecialCollectionRepository extends MongoRepository<SpecialCollection, String> {
    List<SpecialCollection> findByUserId(String userId);
    List<SpecialCollection> findByDateAndTimeSlot(String date, String timeSlot);
    boolean existsByUserIdAndPaymentStatus(String userId, String paymentStatus);
}


