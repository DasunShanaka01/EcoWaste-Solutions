package com.eco_waste_solutions.eco_waste_solutions.Waste;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WasteService {

    @Autowired
    private WasteRepository wasteRepository;

    public List<Waste> findAll() {
        return wasteRepository.findAll();
    }

}
