package com.eco_waste_solutions.eco_waste_solutions.Waste;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WasteRepository extends MongoRepository<Waste, ObjectId> {
    // Custom query methods (if needed) can be defined here
    
}
