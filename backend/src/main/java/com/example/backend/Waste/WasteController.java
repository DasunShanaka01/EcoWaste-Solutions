package com.example.backend.Waste;

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
import com.example.backend.service.RecyclableWasteService;
import com.example.backend.service.FileUploadService;
import com.example.backend.validator.RecyclableWasteValidator;

import lombok.RequiredArgsConstructor;

/**
 * REST Controller for waste-related operations
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This class has a single
 * responsibility - handling HTTP requests for waste operations
 * - Open/Closed Principle (OCP): Extends functionality through delegation to
 * services without modifying existing code
 * - Liskov Substitution Principle (LSP): Can work with any service
 * implementations that follow their contracts
 * - Interface Segregation Principle (ISP): Uses focused service interfaces
 * rather than large, monolithic ones
 * - Dependency Inversion Principle (DIP): Depends on abstractions (services)
 * rather than concrete implementations
 */
@RestController
@RequestMapping("/api/waste")
@RequiredArgsConstructor
public class WasteController {

	// SOLID PRINCIPLE: Dependency Inversion Principle (DIP)
	// Depends on abstractions (service interfaces) rather than concrete
	// implementations
	private final WasteService wasteService;
	private final RecyclableWasteService recyclableWasteService;
	private final FileUploadService fileUploadService;
	private final RecyclableWasteValidator validator;

	// SOLID PRINCIPLE: Dependency Inversion Principle (DIP)
	// Uses Spring's dependency injection for ObjectMapper and EmailService
	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private EmailService emailService;

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

	// SOLID PRINCIPLE: Single Responsibility Principle (SRP)
	// This method has a single responsibility - handling waste submission requests
	// Insert waste with image - Refactored to follow SOLID principles
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

			// Parse JSON strings to objects using ObjectMapper
			Waste.PickupDetails pickup = objectMapper.readValue(pickupJson, Waste.PickupDetails.class);
			List<Waste.Item> items = objectMapper.readValue(itemsJson,
					objectMapper.getTypeFactory().constructCollectionType(List.class, Waste.Item.class));
			Waste.GeoLocation location = objectMapper.readValue(locationJson, Waste.GeoLocation.class);

			// SOLID PRINCIPLE: Single Responsibility Principle (SRP)
			// Delegates file upload responsibility to dedicated service
			String imageUrl = fileUploadService.saveFile(imageFile);

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

			// Create Waste object
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

			// SOLID PRINCIPLE: Single Responsibility Principle (SRP)
			// Delegates validation responsibility to dedicated validator
			List<String> validationErrors = validator.validateWasteSubmission(waste);
			if (!validationErrors.isEmpty()) {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Validation failed");
				errorResponse.put("details", validationErrors);
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
			}

			// SOLID PRINCIPLE: Single Responsibility Principle (SRP)
			// Delegates file validation responsibility to dedicated validator
			if (imageFile != null && !imageFile.isEmpty()) {
				List<String> fileErrors = validator.validateFileUpload(imageFile);
				if (!fileErrors.isEmpty()) {
					Map<String, Object> errorResponse = new HashMap<>();
					errorResponse.put("error", "File validation failed");
					errorResponse.put("details", fileErrors);
					return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
				}
			}

			// SOLID PRINCIPLE: Single Responsibility Principle (SRP)
			// Delegates waste processing responsibility to dedicated service
			waste = recyclableWasteService.processSubmission(waste);

			// Save using original service (maintaining backward compatibility)
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
				imageUrl = fileUploadService.saveFile(imageFile);
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
					wasteToUpdate.setImageUrl(imageUrl);
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

	// Update payment status by simple ID - Refactored to use payback strategies
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

				// Process payback using strategy pattern
				if ("Complete".equals(newPaymentStatus) && !"Complete".equals(oldPaymentStatus)) {
					try {
						// Use recyclable waste service to process payback
						com.example.backend.strategy.PaybackStrategy.PaybackResult paybackResult = recyclableWasteService
								.processPayback(updatedWaste);

						if (paybackResult.isSuccess()) {
							System.out.println("Payback processed successfully: " + paybackResult.getMessage());
						} else {
							System.err.println("Payback processing failed: " + paybackResult.getMessage());
						}
					} catch (Exception e) {
						System.err.println("Error processing payback: " + e.getMessage());
						// Don't fail the payment status update if payback processing fails
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

	// Update actual weight and recalculate payback - Refactored to use recyclable
	// waste service
	@PutMapping("/{id}/actual-weight")
	public ResponseEntity<Map<String, Object>> updateActualWeight(@PathVariable String id,
			@RequestBody Map<String, Object> request) {
		try {
			Double actualWeight = ((Number) request.get("actualWeight")).doubleValue();
			if (actualWeight == null || actualWeight <= 0) {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Actual weight must be greater than 0");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
			}

			Optional<Waste> wasteOpt = wasteService.findBySimpleId(id);
			if (wasteOpt.isPresent()) {
				Waste waste = wasteOpt.get();

				// Get the category from the first item
				String category = "E-waste"; // Default category
				if (waste.getItems() != null && !waste.getItems().isEmpty()) {
					category = waste.getItems().get(0).getCategory();
				}

				// Calculate actual payback amount using recyclable waste service
				double actualPaybackAmount = recyclableWasteService.calculatePaybackAmount(actualWeight, category);

				// Calculate actual digital wallet points (1 point per LKR)
				Integer actualDigitalWalletPoints = (int) Math.round(actualPaybackAmount);

				// Update the waste with actual weight, payback, and digital wallet points
				waste.setActualWeightKg(actualWeight);
				waste.setActualPaybackAmount(actualPaybackAmount);
				waste.setActualDigitalWalletPoints(actualDigitalWalletPoints);

				Waste updatedWaste = wasteService.updateWaste(waste);

				Map<String, Object> response = new HashMap<>();
				response.put("wasteId", updatedWaste.getId().toString());
				response.put("simpleId", id);
				response.put("actualWeightKg", updatedWaste.getActualWeightKg());
				response.put("actualPaybackAmount", updatedWaste.getActualPaybackAmount());
				response.put("actualDigitalWalletPoints", updatedWaste.getActualDigitalWalletPoints());
				response.put("estimatedWeightKg", updatedWaste.getTotalWeightKg());
				response.put("estimatedPaybackAmount", updatedWaste.getTotalPaybackAmount());
				response.put("estimatedDigitalWalletPoints", updatedWaste.getDigitalWalletPoints());
				response.put("category", category);
				response.put("ratePerKg", recyclableWasteService.getRatePerKg(category));
				response.put("message", "Actual weight, payback, and digital wallet points updated successfully");
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Waste not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("error", "Error updating actual weight: " + e.getMessage());
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

	// Get supported categories - New endpoint following SOLID principles
	@GetMapping("/categories")
	public ResponseEntity<List<String>> getSupportedCategories() {
		List<String> categories = recyclableWasteService.getSupportedCategories();
		return new ResponseEntity<>(categories, HttpStatus.OK);
	}

	// Get supported payback methods - New endpoint following SOLID principles
	@GetMapping("/payback-methods")
	public ResponseEntity<List<String>> getSupportedPaybackMethods() {
		List<String> paybackMethods = recyclableWasteService.getSupportedPaybackMethods();
		return new ResponseEntity<>(paybackMethods, HttpStatus.OK);
	}

	// Get rate per kg for category - New endpoint following SOLID principles
	@GetMapping("/rate/{category}")
	public ResponseEntity<Map<String, Object>> getRatePerKg(@PathVariable String category) {
		double rate = recyclableWasteService.getRatePerKg(category);
		Map<String, Object> response = new HashMap<>();
		response.put("category", category);
		response.put("ratePerKg", rate);
		return new ResponseEntity<>(response, HttpStatus.OK);
	}

}
