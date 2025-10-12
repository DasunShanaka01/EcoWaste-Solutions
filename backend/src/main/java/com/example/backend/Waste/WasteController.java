package com.example.backend.Waste;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/waste")
@CrossOrigin(origins = "*", allowedHeaders = "*") // For testing, allow all origins
//@CrossOrigin(origins = "http://localhost:3000") // Adjust this to your frontend's URL
@RequiredArgsConstructor
public class WasteController {

	private final WasteService wasteService;

	private static final String UPLOAD_DIR = "backend/eco_waste_solutions/uploads/";

	@GetMapping("/wastes")
	public ResponseEntity<List<Waste>> getAllWastes() {
		return new ResponseEntity<>(wasteService.findAll(), HttpStatus.OK);
	}

	//Insert waste with image
	@PostMapping(value = "/add", consumes = "multipart/form-data")
	public ResponseEntity<Waste> save(
		@RequestPart("userId") String userId,
		@RequestPart("submissionMethod") String submissionMethod,
		@RequestPart("status") String status,
		@RequestPart("pickup") Waste.PickupDetails pickup,
		@RequestPart("totalWeightKg") double totalWeightKg,
		@RequestPart("totalPaybackAmount") double totalPaybackAmount,
		@RequestPart("paymentMethod") String paymentMethod,
		@RequestPart("paymentStatus") String paymentStatus,
		@RequestPart("items") List<Waste.Item> items,
		@RequestPart("location") Waste.GeoLocation location,
		@RequestPart(value = "imageFile",required = false) MultipartFile imageFile
	) {
		try {
			String imageUrl = null;
			if (imageFile != null && !imageFile.isEmpty()) {
				// Save the file to the server (you might want to add error handling here)
				String filePath = UPLOAD_DIR + imageFile.getOriginalFilename();
				imageFile.transferTo(new java.io.File(filePath));
				imageUrl = filePath; // In a real app, this would be a URL accessible by the frontend
			}

			Waste savedWaste = wasteService.save(userId, submissionMethod, status, pickup,
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
		@RequestPart("submissionMethod") String submissionMethod,
		@RequestPart("status") String status,
		@RequestPart("pickup") Waste.PickupDetails pickup,
		@RequestPart("totalWeightKg") double totalWeightKg,
		@RequestPart("totalPaybackAmount") double totalPaybackAmount,
		@RequestPart("paymentMethod") String paymentMethod,
		@RequestPart("paymentStatus") String paymentStatus,
		@RequestPart("items") List<Waste.Item> items,
		@RequestPart("location") Waste.GeoLocation location,
		@RequestPart(value = "imageFile", required = false) MultipartFile imageFile
	) {
		try {
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
				if (imageUrl != null && !imageUrl.isEmpty()) {
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


}
