package com.example.backend.Waste;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WasteRepository extends MongoRepository<Waste, ObjectId> {
    // Find all waste submissions by userId
    List<Waste> findByUserId(String userId);

    // Find waste submissions by userId ordered by submission date (newest first)
    List<Waste> findByUserIdOrderBySubmissionDateDesc(String userId);
}