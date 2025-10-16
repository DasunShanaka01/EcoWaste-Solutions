package com.example.backend.Waste;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/waste")
@RequiredArgsConstructor
public class WasteController {

	private final WasteService wasteService;

	private static final String UPLOAD_DIR = "uploads/";

	@GetMapping("/wastes")
	public ResponseEntity<List<Waste>> getAllWastes() {
		return new ResponseEntity<>(wasteService.findAll(), HttpStatus.OK);
	}

	@GetMapping("/test")
	public ResponseEntity<String> testEndpoint() {
		return new ResponseEntity<>("Waste API is working!", HttpStatus.OK);
	}

	// Insert waste with image
	@PostMapping(value = "/add", consumes = "multipart/form-data")
	public ResponseEntity<Waste> save(
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

			Waste savedWaste = wasteService.save(userId, fullName, phoneNumber, email, submissionMethod, status, pickup,
					totalWeightKg, totalPaybackAmount, paymentMethod,
					paymentStatus, items, imageUrl, location);
			return new ResponseEntity<>(savedWaste, HttpStatus.CREATED);
		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
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
	public ResponseEntity<Void> deleteWaste(@PathVariable ObjectId id) {
		Optional<Waste> existingWaste = wasteService.findById(id);
		if (existingWaste.isPresent()) {
			wasteService.deleteById(id);
			return new ResponseEntity<>(HttpStatus.NO_CONTENT);
		} else {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
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
					ObjectMapper objectMapper = new ObjectMapper();
					Waste.PickupDetails pickup = objectMapper.convertValue(updates.get("pickup"),
							Waste.PickupDetails.class);
					wasteToUpdate.setPickup(pickup);
				}
				if (updates.containsKey("items")) {
					// Parse items from JSON
					ObjectMapper objectMapper = new ObjectMapper();
					List<Waste.Item> items = objectMapper.convertValue(updates.get("items"),
							objectMapper.getTypeFactory().constructCollectionType(List.class, Waste.Item.class));
					wasteToUpdate.setItems(items);
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

}
