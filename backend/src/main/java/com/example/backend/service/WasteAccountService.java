package com.example.backend.service;

import com.example.backend.model.WasteAccount;
import com.example.backend.model.User;
import com.example.backend.repository.WasteAccountRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.exception.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.Base64;
import java.util.List;
import java.util.Random;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

@Service
public class WasteAccountService {
    
    @Autowired
    private WasteAccountRepository wasteAccountRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public WasteAccount createWasteAccount(String userId, WasteAccount.Location location) {
        // Check if user already has a waste account
        if (wasteAccountRepository.existsByUserId(userId)) {
            throw new CustomException("User already has a waste account");
        }
        
        // Generate unique account ID
        String accountId = generateAccountId();
        
        // Create waste account
        WasteAccount wasteAccount = new WasteAccount(accountId, userId, location);
        
        // Generate QR code for the account ID
        String qrCode = generateQRCode(accountId);
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
    
    private String generateAccountId() {
        // Generate a unique account ID with prefix "WA" (Waste Account)
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        return "WA" + uuid;
    }
    
    private String generateQRCode(String accountId) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(accountId, BarcodeFormat.QR_CODE, 200, 200);
            
            BufferedImage bufferedImage = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
            for (int x = 0; x < 200; x++) {
                for (int y = 0; y < 200; y++) {
                    bufferedImage.setRGB(x, y, bitMatrix.get(x, y) ? 0x000000 : 0xFFFFFF);
                }
            }
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(bufferedImage, "PNG", baos);
            byte[] imageBytes = baos.toByteArray();
            
            return Base64.getEncoder().encodeToString(imageBytes);
        } catch (WriterException | java.io.IOException e) {
            throw new CustomException("Failed to generate QR code: " + e.getMessage());
        }
    }
}
