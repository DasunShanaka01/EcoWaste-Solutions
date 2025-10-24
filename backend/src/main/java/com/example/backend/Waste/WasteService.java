package com.example.backend.Waste;

import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.backend.service.QRCodeService;
import com.example.backend.service.DigitalWalletService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WasteService {

    // This is the repository that interacts with MongoDB
    private final WasteRepository wasteRepository;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private DigitalWalletService digitalWalletService;

    public List<Waste> findAll() {
        return wasteRepository.findAll();
    }

    // Optional: method to find waste by its ID
    public Optional<Waste> findById(ObjectId id) {
        return wasteRepository.findById(id);
    }

    // add waste
    public Waste save(String userId, String fullName, String phoneNumber, String email, String submissionMethod,
            String status, Waste.PickupDetails pickup,
            double totalWeightKg, double totalPaybackAmount, String paymentMethod,
            String paymentStatus, String paybackMethod, Waste.BankTransferDetails bankTransferDetails,
            Integer digitalWalletPoints, String charityOrganization, List<Waste.Item> items, String imageUrl,
            Waste.GeoLocation location) {
        Waste waste = new Waste();
        waste.setUserId(userId);
        waste.setFullName(fullName);
        waste.setPhoneNumber(phoneNumber);
        waste.setEmail(email);
        waste.setSubmissionMethod(submissionMethod);
        waste.setStatus(status);
        waste.setPickup(pickup);
        waste.setTotalWeightKg(totalWeightKg);
        waste.setTotalPaybackAmount(totalPaybackAmount);
        waste.setPaymentMethod(paymentMethod);
        waste.setPaymentStatus(paymentStatus);
        waste.setPaybackMethod(paybackMethod);
        waste.setBankTransferDetails(bankTransferDetails);
        waste.setDigitalWalletPoints(digitalWalletPoints);
        waste.setCharityOrganization(charityOrganization);
        waste.setItems(items);
        waste.setImageUrl(imageUrl);
        waste.setLocation(location);
        waste.setSubmissionDate(java.time.LocalDateTime.now());

        // Save first to get the ID, then generate QR code
        Waste savedWaste = wasteRepository.save(waste);

        // Handle digital wallet points if payback method is Digital Wallet
        if (paybackMethod != null && paybackMethod.equals("Digital Wallet") && digitalWalletPoints != null
                && digitalWalletPoints > 0) {
            try {
                digitalWalletService.addPoints(userId, digitalWalletPoints,
                        "Points earned from waste recycling - "
                                + (items.isEmpty() ? "Mixed" : items.get(0).getCategory()) +
                                " (" + totalWeightKg + "kg)");
            } catch (Exception e) {
                System.err.println("Error adding digital wallet points: " + e.getMessage());
                // Continue even if digital wallet update fails
            }
        }

        // Generate QR code with waste details
        try {
            String qrData = qrCodeService.generateDetailedWasteQRData(
                    savedWaste.getId().toString(),
                    fullName,
                    items.isEmpty() ? "Mixed" : items.get(0).getCategory(),
                    totalWeightKg,
                    submissionMethod,
                    status,
                    totalPaybackAmount,
                    phoneNumber);
            String qrCodeBase64 = qrCodeService.generateQRCodeBase64(qrData);
            String qrCodeBase64 = qrCodeService.generateQRCodeBase64(qrData, 200, 200);
            savedWaste.setQrCodeBase64(qrCodeBase64);
            return wasteRepository.save(savedWaste);
        } catch (Exception e) {
            System.err.println("Error generating QR code: " + e.getMessage());
            // Return waste without QR code if generation fails
            return savedWaste;
        }
    }

    public void deleteById(ObjectId id) {
        wasteRepository.deleteById(id);
    }

    public Waste update(Waste waste) {
        return wasteRepository.save(waste);
    }

    // Find all waste submissions by userId
    public List<Waste> findByUserId(String userId) {
        return wasteRepository.findByUserId(userId);
    }

    // Find waste submissions by userId ordered by submission date (newest first)
    public List<Waste> findByUserIdOrderBySubmissionDateDesc(String userId) {
        return wasteRepository.findByUserIdOrderBySubmissionDateDesc(userId);
    }

    // Find waste by simple ID (last 6 digits)
    public Optional<Waste> findBySimpleId(String id) {
        // First try to find by full waste ID if it looks like a full ObjectId (24
        // characters)
        if (id.length() == 24) {
            try {
                return wasteRepository.findById(new ObjectId(id));
            } catch (Exception e) {
                // Continue to simple ID search
            }
        }

        // Try to find by simple ID (last 6 digits)
        List<Waste> allWastes = wasteRepository.findAll();
        return allWastes.stream()
                .filter(waste -> {
                    String wasteId = waste.getId().toString();
                    String simpleId = wasteId.length() >= 6 ? wasteId.substring(wasteId.length() - 6) : wasteId;
                    return simpleId.equals(id);
                })
                .findFirst();
    }

    // Update waste status by simple ID
    public Optional<Waste> updateBySimpleId(String id, String newStatus) {
        Optional<Waste> wasteOpt = findBySimpleId(id);
        if (wasteOpt.isPresent()) {
            Waste waste = wasteOpt.get();
            waste.setStatus(newStatus);
            return Optional.of(wasteRepository.save(waste));
        }
        return Optional.empty();
    }

    // Update waste object directly
    public Waste updateWaste(Waste waste) {
        return wasteRepository.save(waste);
    }

    // Generate QR code base64 for waste
    public String generateQRCodeBase64(String wasteId, String userId) {
        try {
            String qrData = qrCodeService.generateWasteQRData(wasteId, userId);
            return qrCodeService.generateQRCodeBase64(qrData, 200, 200);
        } catch (Exception e) {
            System.err.println("Error generating QR code base64: " + e.getMessage());
            return null;
        }
    }

    // Generate QR code bytes for waste
    public byte[] generateQRCodeBytes(String wasteId, String userId) {
        try {
            String qrData = qrCodeService.generateWasteQRData(wasteId, userId);
            return qrCodeService.generateQRCodeBytes(qrData, 200, 200);
        } catch (Exception e) {
            System.err.println("Error generating QR code bytes: " + e.getMessage());
            return null;
        }
    }

}
