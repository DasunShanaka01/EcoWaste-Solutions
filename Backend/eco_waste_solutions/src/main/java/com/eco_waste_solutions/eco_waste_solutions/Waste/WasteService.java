package com.eco_waste_solutions.eco_waste_solutions.Waste;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

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
    public Waste save(Waste waste) {
        return wasteRepository.save(waste);
    }

    public void deleteById(ObjectId id) {
        wasteRepository.deleteById(id);
    }

    public Waste update(Waste waste) {
        return wasteRepository.save(waste);
    }
    
    



}
