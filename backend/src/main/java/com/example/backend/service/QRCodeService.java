package com.example.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
public class QRCodeService {

    public String generateQRCodeBase64(String data, int width, int height) throws WriterException, IOException {
        System.out.println("QRCodeService: Generating QR code base64 for data: " + data);
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, width, height);
        System.out.println("QRCodeService: BitMatrix created successfully");
        
        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        byte[] pngData = pngOutputStream.toByteArray();
        System.out.println("QRCodeService: PNG data generated, length: " + pngData.length);
        
        String base64 = Base64.getEncoder().encodeToString(pngData);
        System.out.println("QRCodeService: Base64 encoded, length: " + base64.length());
        return base64;
    }

    public byte[] generateQRCodeBytes(String data, int width, int height) throws WriterException, IOException {
        System.out.println("QRCodeService: Generating QR code bytes for data: " + data);
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, width, height);
        System.out.println("QRCodeService: BitMatrix created successfully");
        
        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        byte[] result = pngOutputStream.toByteArray();
        System.out.println("QRCodeService: PNG bytes generated, length: " + result.length);
        
        return result;
    }

    public String generateCollectionQRData(String collectionId, String userId) {
        // Extract last 6 digits for simple ID
        String simpleId = collectionId.length() >= 6 ? collectionId.substring(collectionId.length() - 6) : collectionId;
        String qrData = String.format("EWS_COLLECTION:%s:%s", simpleId, userId);
        System.out.println("QRCodeService: Generated collection QR data: " + qrData);
        return qrData;
    }

    public String generateWasteQRData(String wasteId, String userId) {
        // Extract last 6 digits for simple ID
        String simpleId = wasteId.length() >= 6 ? wasteId.substring(wasteId.length() - 6) : wasteId;
        String qrData = String.format("EWS_WASTE:%s:%s", simpleId, userId);
        System.out.println("QRCodeService: Generated waste QR data: " + qrData);
        return qrData;
    }

    public String generateDetailedWasteQRData(String wasteId, String fullName, String category, 
            double totalWeightKg, String submissionMethod, String status, 
            double totalPaybackAmount, String phoneNumber) {
        // Extract last 6 digits for simple ID
        String simpleId = wasteId.length() >= 6 ? wasteId.substring(wasteId.length() - 6) : wasteId;
        String qrData = String.format("EWS_WASTE:%s", simpleId);
        System.out.println("QRCodeService: Generated detailed waste QR data: " + qrData);
        return qrData;
    }
}