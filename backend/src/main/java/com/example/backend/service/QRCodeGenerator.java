package com.example.backend.service;

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

/**
 * Service responsible for QR code generation
 * Single Responsibility: QR code generation logic
 */
@Service
public class QRCodeGenerator {
    
    /**
     * Generates a QR code image as Base64 string
     */
    public String generateQRCode(String data) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, 200, 200);
            
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
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage(), e);
        }
    }
}
