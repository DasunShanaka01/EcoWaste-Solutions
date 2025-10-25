package com.example.backend.service;

import com.example.backend.model.WasteAccount;
import com.example.backend.repository.WasteAccountRepository;
import com.example.backend.exception.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Random;

/**
 * Service responsible for randomizing waste account capacity
 * Single Responsibility: Capacity randomization logic
 */
@Service
public class CapacityRandomizer {
    
    @Autowired
    private WasteAccountRepository wasteAccountRepository;
    
    /**
     * Auto-randomizes capacity for all waste accounts based on a percentage parameter
     * @param percentage The percentage of accounts to randomize (0.0 to 1.0)
     * @return List of updated waste accounts
     */
    public List<WasteAccount> randomizeCapacity(double percentage) {
        if (percentage < 0.0 || percentage > 1.0) {
            throw new CustomException("Percentage must be between 0.0 and 1.0");
        }
        
        List<WasteAccount> allAccounts = wasteAccountRepository.findAll();
        Random random = new Random();
        
        // Calculate how many accounts to randomize
        int accountsToRandomize = (int) Math.round(allAccounts.size() * percentage);
        
        // Shuffle the list to randomize selection
        java.util.Collections.shuffle(allAccounts);
        
        // Randomize capacity for selected accounts
        for (int i = 0; i < accountsToRandomize && i < allAccounts.size(); i++) {
            WasteAccount account = allAccounts.get(i);
            // Generate random capacity between 0 and 100
            double randomCapacity = random.nextDouble() * 100.0;
            account.setCapacity(Math.round(randomCapacity * 100.0) / 100.0); // Round to 2 decimal places
        }
        
        // Save all updated accounts
        return wasteAccountRepository.saveAll(allAccounts);
    }
}
