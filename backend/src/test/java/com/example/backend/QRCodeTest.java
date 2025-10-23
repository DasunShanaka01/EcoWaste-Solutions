package com.example.backend;

import com.example.backend.service.QRCodeService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class QRCodeTest {

    @Test
    public void testQRCodeGeneration() {
        try {
            QRCodeService qrService = new QRCodeService();

            // Test basic QR code generation
            String testData = "Test QR Code Data";
            String qrCodeBase64 = qrService.generateQRCodeBase64(testData, 200, 200);

            assertNotNull(qrCodeBase64);
            assertFalse(qrCodeBase64.isEmpty());

            // Test collection QR data generation
            String collectionQRData = qrService.generateCollectionQRData(
                    "test123",
                    "user456");

            assertNotNull(collectionQRData);
            assertTrue(collectionQRData.contains("EWS_COLLECTION"));
            assertTrue(collectionQRData.contains("test123"));
            assertTrue(collectionQRData.contains("user456"));

            System.out.println("QR Code generation test passed!");
            System.out.println("Sample QR Data:");
            System.out.println(collectionQRData);

        } catch (Exception e) {
            fail("QR Code generation failed: " + e.getMessage());
        }
    }
}
