package com.example.backend.service;

import com.example.backend.model.WasteAccount;
import com.example.backend.model.User;
import com.example.backend.repository.WasteAccountRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.exception.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * Service responsible for waste account management
 * Single Responsibility: Waste account business logic
 */
@Service
public class WasteAccountService {
    
    @Autowired
    private WasteAccountRepository wasteAccountRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private QRCodeGenerator qrCodeGenerator;
    
    @Autowired
    private AccountIdGenerator accountIdGenerator;
    
    @Autowired
    private CapacityRandomizer capacityRandomizer;
    
    public WasteAccount createWasteAccount(String userId, WasteAccount.Location location) {
        // Check if user already has a waste account
        if (wasteAccountRepository.existsByUserId(userId)) {
            throw new CustomException("User already has a waste account");
        }
        
        // Generate unique account ID
        String accountId = accountIdGenerator.generateAccountId();
        
        // Create waste account
        WasteAccount wasteAccount = new WasteAccount(accountId, userId, location);
        
        // Generate QR code for the account ID
        String qrCode = qrCodeGenerator.generateQRCode(accountId);
        wasteAccount.setQrCode(qrCode);
        
        return wasteAccountRepository.save(wasteAccount);
    }
    
    public WasteAccount getWasteAccountByUserId(String userId) {
        return wasteAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException("Waste account not found for user"));
    }
    
    public WasteAccount getWasteAccountByAccountId(String accountId) {
        return wasteAccountRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Waste account not found"));
    }
    
    /**
     * Get waste account details for QR scanning
     * @param accountId The account ID from QR code
     * @return Map containing waste account details for collector
     */
    public java.util.Map<String, Object> getWasteAccountDetailsForScanning(String accountId) {
        WasteAccount account = getWasteAccountByAccountId(accountId);
        
        // Get user details
        User user = userRepository.findById(account.getUserId())
                .orElseThrow(() -> new CustomException("User not found for waste account"));
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("accountId", account.getAccountId());
        response.put("userId", account.getUserId());
        response.put("userName", user.getName());
        response.put("userEmail", user.getEmail());
        response.put("userPhone", user.getPhone());
        response.put("address", account.getLocation().getAddress());
        response.put("city", account.getLocation().getCity());
        response.put("country", account.getLocation().getCountry());
        response.put("latitude", account.getLocation().getLatitude());
        response.put("longitude", account.getLocation().getLongitude());
        response.put("capacity", account.getCapacity());
        response.put("isActive", account.isActive());
        response.put("createdAt", account.getCreatedAt());
        
        return response;
    }
    
    public boolean hasWasteAccount(String userId) {
        return wasteAccountRepository.existsByUserId(userId);
    }
    
    public java.util.List<WasteAccount> getAllWasteAccounts() {
        return wasteAccountRepository.findAll();
    }
    
    /**
     * Auto-randomizes capacity for all waste accounts based on a percentage parameter
     * @param percentage The percentage of accounts to randomize (0.0 to 1.0)
     * @return List of updated waste accounts
     */
    public List<WasteAccount> autoRandomizeCapacity(double percentage) {
        return capacityRandomizer.randomizeCapacity(percentage);
    }
    
}
