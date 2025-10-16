package com.example.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class QRCodeService {

    private static final int QR_CODE_SIZE = 300;
    private static final String IMAGE_FORMAT = "PNG";

    /**
     * Generate QR code as Base64 encoded string
     */
    public String generateQRCodeBase64(String data) throws WriterException, IOException {
        BufferedImage qrCodeImage = generateQRCodeImage(data);
        return encodeImageToBase64(qrCodeImage);
    }

    /**
     * Generate QR code as BufferedImage
     */
    public BufferedImage generateQRCodeImage(String data) throws WriterException {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.L);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);

        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE, hints);

        int width = bitMatrix.getWidth();
        int height = bitMatrix.getHeight();
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, width, height);
        graphics.setColor(Color.BLACK);

        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                if (bitMatrix.get(x, y)) {
                    graphics.fillRect(x, y, 1, 1);
                }
            }
        }

        graphics.dispose();
        return image;
    }

    /**
     * Encode BufferedImage to Base64 string
     */
    private String encodeImageToBase64(BufferedImage image) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, IMAGE_FORMAT, baos);
        byte[] imageBytes = baos.toByteArray();
        return Base64.getEncoder().encodeToString(imageBytes);
    }

    /**
     * Generate QR code data for waste submission
     */
    public String generateWasteQRData(String wasteId, String userName, String category, double weight,
            String submissionMethod) {
        StringBuilder qrData = new StringBuilder();
        qrData.append("WASTE_ID:").append(wasteId).append("\n");
        qrData.append("USER:").append(userName).append("\n");
        qrData.append("CATEGORY:").append(category).append("\n");
        qrData.append("WEIGHT:").append(weight).append("kg\n");
        qrData.append("METHOD:").append(submissionMethod).append("\n");
        qrData.append("TIMESTAMP:").append(System.currentTimeMillis());
        return qrData.toString();
    }

    /**
     * Generate QR code data for waste submission with more details
     */
    public String generateDetailedWasteQRData(String wasteId, String userName, String category,
            double weight, String submissionMethod, String status,
            double paybackAmount, String phoneNumber) {
        StringBuilder qrData = new StringBuilder();
        qrData.append("=== WASTE RECYCLING RECEIPT ===\n");
        qrData.append("ID: ").append(wasteId).append("\n");
        qrData.append("User: ").append(userName).append("\n");
        qrData.append("Phone: ").append(phoneNumber).append("\n");
        qrData.append("Category: ").append(category).append("\n");
        qrData.append("Weight: ").append(weight).append(" kg\n");
        qrData.append("Method: ").append(submissionMethod).append("\n");
        qrData.append("Status: ").append(status).append("\n");
        qrData.append("Payback: LKR ").append(String.format("%.2f", paybackAmount)).append("\n");
        qrData.append("Generated: ").append(new java.util.Date().toString());
        return qrData.toString();
    }
}
