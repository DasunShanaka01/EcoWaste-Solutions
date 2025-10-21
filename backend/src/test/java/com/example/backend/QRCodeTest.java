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
            String qrCodeBase64 = qrService.generateQRCodeBase64(testData);

            assertNotNull(qrCodeBase64);
            assertFalse(qrCodeBase64.isEmpty());

            // Test waste QR data generation
            String wasteQRData = qrService.generateDetailedWasteQRData(
                    "test123",
                    "John Doe",
                    "Plastic",
                    10.5,
                    "Home Pickup",
                    "Pending",
                    150.0,
                    "1234567890");

            assertNotNull(wasteQRData);
            assertTrue(wasteQRData.contains("John Doe"));
            assertTrue(wasteQRData.contains("Plastic"));
            assertTrue(wasteQRData.contains("10.5"));

            System.out.println("QR Code generation test passed!");
            System.out.println("Sample QR Data:");
            System.out.println(wasteQRData);

        } catch (Exception e) {
            fail("QR Code generation failed: " + e.getMessage());
        }
    }
}
