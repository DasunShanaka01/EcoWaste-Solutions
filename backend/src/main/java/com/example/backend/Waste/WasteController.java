package com.example.backend.Waste;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.backend.service.EmailService;
import com.example.backend.service.DigitalWalletService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/waste")
@RequiredArgsConstructor
public class WasteController {

	private final WasteService wasteService;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private EmailService emailService;

	@Autowired
	private DigitalWalletService digitalWalletService;

	private static final String UPLOAD_DIR = "uploads/";

	@GetMapping("/wastes")
	public ResponseEntity<List<Waste>> getAllWastes() {
		return new ResponseEntity<>(wasteService.findAll(), HttpStatus.OK);
	}

	// Get collection history for collectors
	@GetMapping("/collections")
	public ResponseEntity<List<Waste>> getCollectionHistory() {
		return new ResponseEntity<>(wasteService.findAll(), HttpStatus.OK);
	}

	@GetMapping("/test")
	public ResponseEntity<String> testEndpoint() {
		return new ResponseEntity<>("Waste API is working!", HttpStatus.OK);
	}

	// Insert waste with image
	@PostMapping(value = "/add", consumes = "multipart/form-data")
	public ResponseEntity<?> save(
			@RequestPart("userId") String userId,
			@RequestPart("fullName") String fullName,
			@RequestPart("phoneNumber") String phoneNumber,
			@RequestPart("email") String email,
			@RequestPart("submissionMethod") String submissionMethod,
			@RequestPart("status") String status,
			@RequestPart("pickup") String pickupJson,
			@RequestPart("totalWeightKg") String totalWeightKgStr,
			@RequestPart("totalPaybackAmount") String totalPaybackAmountStr,
			@RequestPart("paymentMethod") String paymentMethod,
			@RequestPart("paymentStatus") String paymentStatus,
			@RequestPart("paybackMethod") String paybackMethod,
			@RequestPart(value = "bankTransferDetails", required = false) String bankTransferDetailsJson,
			@RequestPart(value = "digitalWalletPoints", required = false) String digitalWalletPointsStr,
			@RequestPart(value = "charityOrganization", required = false) String charityOrganization,
			@RequestPart("items") String itemsJson,
			@RequestPart("location") String locationJson,
			@RequestPart(value = "imageFile", required = false) MultipartFile imageFile) {
		try {
			// Convert string parameters to double
			double totalWeightKg = Double.parseDouble(totalWeightKgStr);
			double totalPaybackAmount = Double.parseDouble(totalPaybackAmountStr);

			// Parse JSON strings to objects
			// Using injected ObjectMapper with JSR310 configuration
			ObjectMapper objectMapper = new ObjectMapper();
			Waste.PickupDetails pickup = objectMapper.readValue(pickupJson, Waste.PickupDetails.class);
			List<Waste.Item> items = objectMapper.readValue(itemsJson,
					objectMapper.getTypeFactory().constructCollectionType(List.class, Waste.Item.class));
			Waste.GeoLocation location = objectMapper.readValue(locationJson, Waste.GeoLocation.class);

			String imageUrl = null;
			if (imageFile != null && !imageFile.isEmpty()) {
				try {
					// Create upload directory if it doesn't exist
					Path uploadPath = Paths.get(UPLOAD_DIR);
					Files.createDirectories(uploadPath);

					// Generate unique filename to avoid conflicts
					String filename = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
					Path filePath = uploadPath.resolve(filename);

					// Save the file
					Files.write(filePath, imageFile.getBytes());
					imageUrl = "/uploads/" + filename;
				} catch (Exception e) {
					System.err.println("Error saving image file: " + e.getMessage());
					// Continue without image if file save fails
				}
			}

			// Parse payback method specific details
			Waste.BankTransferDetails bankTransferDetails = null;
			Integer digitalWalletPoints = null;
			if (paybackMethod.equals("Bank Transfer") && bankTransferDetailsJson != null
					&& !bankTransferDetailsJson.isEmpty()) {
				bankTransferDetails = objectMapper.readValue(bankTransferDetailsJson, Waste.BankTransferDetails.class);
			}
			if (paybackMethod.equals("Digital Wallet") && digitalWalletPointsStr != null
					&& !digitalWalletPointsStr.isEmpty()) {
				digitalWalletPoints = Integer.parseInt(digitalWalletPointsStr);
			}

			Waste savedWaste = wasteService.save(userId, fullName, phoneNumber, email, submissionMethod, status, pickup,
					totalWeightKg, totalPaybackAmount, paymentMethod,
					paymentStatus, paybackMethod, bankTransferDetails, digitalWalletPoints, charityOrganization, items,
					imageUrl, location);
			return new ResponseEntity<>(savedWaste, HttpStatus.CREATED);
		} catch (Exception e) {
			System.err.println("Error in waste submission: " + e.getMessage());
			e.printStackTrace();
			return new ResponseEntity<String>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping("/{id}")
	public ResponseEntity<Waste> getWasteById(@PathVariable ObjectId id) {
		Optional<Waste> waste = wasteService.findById(id);
		return waste.isPresent()
				? new ResponseEntity<>(waste.get(), HttpStatus.OK)
				: new ResponseEntity<>(HttpStatus.NOT_FOUND);
	}

	@PutMapping(value = "/{id}", consumes = "multipart/form-data")
	public ResponseEntity<Waste> updateWaste(
			@PathVariable ObjectId id,
			@RequestPart("userId") String userId,
			@RequestPart("fullName") String fullName,
			@RequestPart("phoneNumber") String phoneNumber,
			@RequestPart("email") String email,
			@RequestPart("submissionMethod") String submissionMethod,
			@RequestPart("status") String status,
			@RequestPart("pickup") String pickupJson,
			@RequestPart("totalWeightKg") String totalWeightKgStr,
			@RequestPart("totalPaybackAmount") String totalPaybackAmountStr,
			@RequestPart("paymentMethod") String paymentMethod,
			@RequestPart("paymentStatus") String paymentStatus,
			@RequestPart("items") String itemsJson,
			@RequestPart("location") String locationJson,
			@RequestPart(value = "imageFile", required = false) MultipartFile imageFile) {
		try {
			// Convert string parameters to double
			double totalWeightKg = Double.parseDouble(totalWeightKgStr);
			double totalPaybackAmount = Double.parseDouble(totalPaybackAmountStr);

			// Parse JSON strings to objects
			// Using injected ObjectMapper with JSR310 configuration
			ObjectMapper objectMapper = new ObjectMapper();
			Waste.PickupDetails pickup = objectMapper.readValue(pickupJson, Waste.PickupDetails.class);
			List<Waste.Item> items = objectMapper.readValue(itemsJson,
					objectMapper.getTypeFactory().constructCollectionType(List.class, Waste.Item.class));
			Waste.GeoLocation location = objectMapper.readValue(locationJson, Waste.GeoLocation.class);

			String imageUrl = null;
			if (imageFile != null && !imageFile.isEmpty()) {
				String filePath = UPLOAD_DIR + imageFile.getOriginalFilename();
				imageFile.transferTo(new java.io.File(filePath));
				imageUrl = filePath;
			}

			Optional<Waste> existingWaste = wasteService.findById(id);
			if (existingWaste.isPresent()) {
				Waste wasteToUpdate = existingWaste.get();
				// Update fields
				wasteToUpdate.setUserId(userId);
				wasteToUpdate.setFullName(fullName);
				wasteToUpdate.setPhoneNumber(phoneNumber);
				wasteToUpdate.setEmail(email);
				wasteToUpdate.setSubmissionMethod(submissionMethod);
				wasteToUpdate.setStatus(status);
				wasteToUpdate.setPickup(pickup);
				wasteToUpdate.setTotalWeightKg(totalWeightKg);
				wasteToUpdate.setTotalPaybackAmount(totalPaybackAmount);
				wasteToUpdate.setPaymentMethod(paymentMethod);
				wasteToUpdate.setPaymentStatus(paymentStatus);
				wasteToUpdate.setItems(items);
				wasteToUpdate.setLocation(location);

				// Handle image file if provided
				if (imageUrl != null && !imageUrl.isEmpty() && imageFile != null) {
					String filename = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
					Path filePath = Paths.get(UPLOAD_DIR, filename);
					Files.createDirectories(filePath.getParent());
					Files.write(filePath, imageFile.getBytes());
					wasteToUpdate.setImageUrl("/uploads/" + filename);
				}

				Waste updatedWaste = wasteService.update(wasteToUpdate);
				return new ResponseEntity<>(updatedWaste, HttpStatus.OK);
			} else {
				return new ResponseEntity<>(HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteWaste(@PathVariable String id) {
		try {
			// Convert string to ObjectId
			ObjectId objectId = new ObjectId(id);
			Optional<Waste> existingWaste = wasteService.findById(objectId);
			if (existingWaste.isPresent()) {
				wasteService.deleteById(objectId);
				return new ResponseEntity<>(HttpStatus.NO_CONTENT);
			} else {
				System.err.println("Waste not found with ID: " + id);
				return new ResponseEntity<>("Waste not found", HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			System.err.println("Error deleting waste with ID " + id + ": " + e.getMessage());
			e.printStackTrace();
			return new ResponseEntity<>("Error deleting waste: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Get waste submissions by userId
	@GetMapping("/user/{userId}")
	public ResponseEntity<List<Waste>> getWastesByUserId(@PathVariable String userId) {
		List<Waste> wastes = wasteService.findByUserIdOrderBySubmissionDateDesc(userId);
		return new ResponseEntity<>(wastes, HttpStatus.OK);
	}

	// Update waste submission (JSON-based for basic updates)
	@PutMapping("/{id}/update")
	public ResponseEntity<Waste> updateWasteBasic(
			@PathVariable ObjectId id,
			@RequestBody Map<String, Object> updates) {
		try {
			Optional<Waste> existingWaste = wasteService.findById(id);
			if (existingWaste.isPresent()) {
				Waste wasteToUpdate = existingWaste.get();

				// Only allow updates to specific fields
				if (updates.containsKey("submissionMethod")) {
					wasteToUpdate.setSubmissionMethod((String) updates.get("submissionMethod"));
				}
				if (updates.containsKey("totalWeightKg")) {
					wasteToUpdate.setTotalWeightKg(((Number) updates.get("totalWeightKg")).doubleValue());
				}
				if (updates.containsKey("totalPaybackAmount")) {
					wasteToUpdate.setTotalPaybackAmount(((Number) updates.get("totalPaybackAmount")).doubleValue());
				}
				if (updates.containsKey("pickup")) {
					// Parse pickup details from JSON
					// Using injected ObjectMapper with JSR310 configuration
					Waste.PickupDetails pickup = objectMapper.convertValue(updates.get("pickup"),
							Waste.PickupDetails.class);
					wasteToUpdate.setPickup(pickup);
				}
				if (updates.containsKey("items")) {
					// Parse items from JSON
					// Using injected ObjectMapper with JSR310 configuration
					List<Waste.Item> items = objectMapper.convertValue(updates.get("items"),
							objectMapper.getTypeFactory().constructCollectionType(List.class, Waste.Item.class));
					wasteToUpdate.setItems(items);
				}
				// Allow status updates via JSON API (e.g., mark as Complete)
				if (updates.containsKey("status")) {
					Object s = updates.get("status");
					if (s != null) {
						wasteToUpdate.setStatus(String.valueOf(s));
					}
				}

				Waste updatedWaste = wasteService.update(wasteToUpdate);
				return new ResponseEntity<>(updatedWaste, HttpStatus.OK);
			} else {
				return new ResponseEntity<>(HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Get QR code for a specific waste submission
	@GetMapping("/{id}/qr-code")
	public ResponseEntity<Map<String, String>> getQRCode(@PathVariable ObjectId id) {
		try {
			Optional<Waste> waste = wasteService.findById(id);
			if (waste.isPresent()) {
				Map<String, String> response = new HashMap<>();
				response.put("qrCodeBase64", waste.get().getQrCodeBase64());
				response.put("wasteId", waste.get().getId().toString());
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				return new ResponseEntity<>(HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Get QR code base64 for a specific waste submission
	@GetMapping("/{id}/qr-base64")
	public ResponseEntity<Map<String, String>> getQRCodeBase64(@PathVariable ObjectId id) {
		try {
			Optional<Waste> waste = wasteService.findById(id);
			if (waste.isPresent()) {
				Waste wasteData = waste.get();
				String qrCodeBase64 = wasteService.generateQRCodeBase64(wasteData.getId().toString(),
						wasteData.getUserId());
				Map<String, String> response = new HashMap<>();
				response.put("qrCode", qrCodeBase64);
				response.put("wasteId", wasteData.getId().toString());
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				return new ResponseEntity<>(HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, String> errorResponse = new HashMap<>();
			errorResponse.put("error", e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Get QR code as image file for download
	@GetMapping("/{id}/qr")
	public ResponseEntity<byte[]> getQRCodeImage(@PathVariable ObjectId id) {
		try {
			Optional<Waste> waste = wasteService.findById(id);
			if (waste.isPresent()) {
				Waste wasteData = waste.get();
				byte[] qrCodeBytes = wasteService.generateQRCodeBytes(wasteData.getId().toString(),
						wasteData.getUserId());
				return ResponseEntity.ok()
						.header("Content-Type", "image/png")
						.header("Content-Disposition", "attachment; filename=qr-code-" + id + ".png")
						.body(qrCodeBytes);
			} else {
				return new ResponseEntity<>(HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Scan QR code and get waste details
	@PostMapping("/scan-qr")
	public ResponseEntity<Map<String, Object>> scanQRCode(@RequestBody Map<String, String> request) {
		try {
			String qrData = request.get("qrData");
			if (qrData == null || qrData.trim().isEmpty()) {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "QR data is required");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
			}

			// Parse QR data to extract waste ID
			String wasteId = null;
			String[] lines = qrData.split("\n");
			for (String line : lines) {
				if (line.startsWith("ID: ")) {
					wasteId = line.substring(4).trim();
					break;
				}
			}

			if (wasteId == null) {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Invalid QR code format");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
			}

			// Find waste by ID
			Optional<Waste> waste = wasteService.findById(new ObjectId(wasteId));
			if (waste.isPresent()) {
				Map<String, Object> response = new HashMap<>();
				Waste wasteData = waste.get();
				response.put("wasteId", wasteData.getId().toString());
				response.put("userName", wasteData.getFullName());
				response.put("phoneNumber", wasteData.getPhoneNumber());
				response.put("email", wasteData.getEmail());
				response.put("category",
						wasteData.getItems().isEmpty() ? "Mixed" : wasteData.getItems().get(0).getCategory());
				response.put("weight", wasteData.getTotalWeightKg());
				response.put("submissionMethod", wasteData.getSubmissionMethod());
				response.put("status", wasteData.getStatus());
				response.put("paybackAmount", wasteData.getTotalPaybackAmount());
				response.put("submissionDate",
						wasteData.getSubmissionDate() != null ? wasteData.getSubmissionDate().toString() : null);
				response.put("items", wasteData.getItems());
				response.put("pickup", wasteData.getPickup());
				response.put("location", wasteData.getLocation());
				response.put("type", "recyclable"); // Add type to distinguish from special waste
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Waste submission not found");
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("error", "Error scanning QR code: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Get waste details by ID (for QR code scanning)
	@GetMapping("/{id}/details")
	public ResponseEntity<Map<String, Object>> getWasteDetails(@PathVariable ObjectId id) {
		try {
			Optional<Waste> waste = wasteService.findById(id);
			if (waste.isPresent()) {
				Map<String, Object> response = new HashMap<>();
				Waste wasteData = waste.get();
				response.put("wasteId", wasteData.getId().toString());
				response.put("userName", wasteData.getFullName());
				response.put("phoneNumber", wasteData.getPhoneNumber());
				response.put("email", wasteData.getEmail());
				response.put("category",
						wasteData.getItems().isEmpty() ? "Mixed" : wasteData.getItems().get(0).getCategory());
				response.put("weight", wasteData.getTotalWeightKg());
				response.put("submissionMethod", wasteData.getSubmissionMethod());
				response.put("status", wasteData.getStatus());
				response.put("paybackAmount", wasteData.getTotalPaybackAmount());
				response.put("submissionDate",
						wasteData.getSubmissionDate() != null ? wasteData.getSubmissionDate().toString() : null);
				response.put("items", wasteData.getItems());
				response.put("pickup", wasteData.getPickup());
				response.put("location", wasteData.getLocation());
				response.put("qrCodeBase64", wasteData.getQrCodeBase64());
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				return new ResponseEntity<>(HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Find waste by simple ID (6-digit ID)
	@GetMapping("/find/{id}")
	public ResponseEntity<Map<String, Object>> findWasteById(@PathVariable String id) {
		try {
			Optional<Waste> waste = wasteService.findBySimpleId(id);
			if (waste.isPresent()) {
				Map<String, Object> response = new HashMap<>();
				Waste wasteData = waste.get();
				response.put("wasteId", wasteData.getId().toString());
				response.put("simpleId",
						wasteData.getId().toString().substring(wasteData.getId().toString().length() - 6));
				response.put("userName", wasteData.getFullName());
				response.put("phoneNumber", wasteData.getPhoneNumber());
				response.put("email", wasteData.getEmail());
				response.put("category",
						wasteData.getItems().isEmpty() ? "Mixed" : wasteData.getItems().get(0).getCategory());
				response.put("weight", wasteData.getTotalWeightKg());
				response.put("submissionMethod", wasteData.getSubmissionMethod());
				response.put("status", wasteData.getStatus());
				response.put("paymentStatus", wasteData.getPaymentStatus());
				response.put("paybackAmount", wasteData.getTotalPaybackAmount());
				response.put("paybackMethod", wasteData.getPaybackMethod());
				response.put("bankTransferDetails", wasteData.getBankTransferDetails());
				response.put("digitalWalletPoints", wasteData.getDigitalWalletPoints());
				response.put("charityOrganization", wasteData.getCharityOrganization());
				response.put("submissionDate",
						wasteData.getSubmissionDate() != null ? wasteData.getSubmissionDate().toString() : null);
				response.put("items", wasteData.getItems());
				response.put("pickup", wasteData.getPickup());
				response.put("location", wasteData.getLocation());
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Waste not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("error", "Error finding waste: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Update waste status by simple ID
	@PutMapping("/{id}/status")
	public ResponseEntity<Map<String, Object>> updateWasteStatus(@PathVariable String id,
			@RequestBody Map<String, String> request) {
		try {
			String newStatus = request.get("status");
			if (newStatus == null) {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Status is required");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
			}

			Optional<Waste> waste = wasteService.updateBySimpleId(id, newStatus);
			if (waste.isPresent()) {
				Map<String, Object> response = new HashMap<>();
				Waste wasteData = waste.get();
				response.put("wasteId", wasteData.getId().toString());
				response.put("simpleId",
						wasteData.getId().toString().substring(wasteData.getId().toString().length() - 6));
				response.put("status", wasteData.getStatus());
				response.put("message", "Waste status updated successfully");
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Waste not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("error", "Error updating waste status: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Update payment status by simple ID
	@PutMapping("/{id}/payment-status")
	public ResponseEntity<Map<String, Object>> updatePaymentStatus(@PathVariable String id,
			@RequestBody Map<String, String> request) {
		try {
			String newPaymentStatus = request.get("paymentStatus");
			if (newPaymentStatus == null) {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Payment status is required");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
			}

			Optional<Waste> wasteOpt = wasteService.findBySimpleId(id);
			if (wasteOpt.isPresent()) {
				Waste waste = wasteOpt.get();
				String oldPaymentStatus = waste.getPaymentStatus();
				System.out.println("Updating payment status for waste ID: " + id);
				System.out.println("Old payment status: " + oldPaymentStatus);
				System.out.println("New payment status: " + newPaymentStatus);

				waste.setPaymentStatus(newPaymentStatus);
				Waste updatedWaste = wasteService.updateWaste(waste);

				System.out.println("Updated waste payment status: " + updatedWaste.getPaymentStatus());

				// Verify the update by fetching from database again
				Optional<Waste> verifyWaste = wasteService.findBySimpleId(id);
				if (verifyWaste.isPresent()) {
					System.out.println("Verification - Payment status in DB: " + verifyWaste.get().getPaymentStatus());
				} else {
					System.out.println("ERROR: Could not find waste after update for verification!");
				}

				// Add points to Digital Wallet if payment status changed to "Complete"
				if ("Complete".equals(newPaymentStatus) && !"Complete".equals(oldPaymentStatus)) {
					try {
						// Calculate points based on payback amount (1 point per LKR)
						int pointsToAdd = (int) Math.round(updatedWaste.getTotalPaybackAmount());
						if (pointsToAdd > 0) {
							digitalWalletService.addPoints(
									updatedWaste.getUserId(),
									pointsToAdd,
									"Points earned from recyclable waste collection - "
											+ updatedWaste.getId().toString());
							System.out.println("Added " + pointsToAdd + " points to user " + updatedWaste.getUserId());
						}
					} catch (Exception e) {
						System.err.println("Error adding points to digital wallet: " + e.getMessage());
						// Don't fail the payment status update if digital wallet update fails
					}
				}

				Map<String, Object> response = new HashMap<>();
				response.put("wasteId", updatedWaste.getId().toString());
				response.put("simpleId",
						updatedWaste.getId().toString().substring(updatedWaste.getId().toString().length() - 6));
				response.put("paymentStatus", updatedWaste.getPaymentStatus());
				response.put("message", "Payment status updated successfully");
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Waste not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("error", "Error updating payment status: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Send collection email notification
	@PostMapping("/send-collection-email")
	public ResponseEntity<Map<String, Object>> sendCollectionEmail(@RequestBody Map<String, Object> request) {
		try {
			String email = (String) request.get("email");
			String wasteId = (String) request.get("wasteId");
			String category = (String) request.get("category");
			Double weight = ((Number) request.get("weight")).doubleValue();
			Double paybackAmount = ((Number) request.get("paybackAmount")).doubleValue();
			String paybackMethod = (String) request.get("paybackMethod");
			String collectedAt = (String) request.get("collectedAt");

			if (email == null || wasteId == null || category == null || weight == null || paybackAmount == null) {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Missing required fields");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
			}

			// Send email notification
			emailService.sendRecyclableWasteCollectedNotification(
					email, wasteId, category, weight, paybackAmount, paybackMethod, collectedAt);

			Map<String, Object> response = new HashMap<>();
			response.put("message", "Collection email sent successfully");
			response.put("wasteId", wasteId);
			return new ResponseEntity<>(response, HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("error", "Failed to send collection email: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
