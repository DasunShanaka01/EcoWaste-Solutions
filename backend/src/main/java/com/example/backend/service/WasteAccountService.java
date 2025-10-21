package com.example.backend.service;

import com.example.backend.model.WasteAccount;
import com.example.backend.repository.WasteAccountRepository;
import com.example.backend.exception.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.Base64;
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
    
    public boolean hasWasteAccount(String userId) {
        return wasteAccountRepository.existsByUserId(userId);
    }
    
    public java.util.List<WasteAccount> getAllWasteAccounts() {
        return wasteAccountRepository.findAll();
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
