package com.example.backend.controller;

import com.example.backend.dto.SpecialCollectionDTOs.FeeRequest;
import com.example.backend.dto.SpecialCollectionDTOs.FeeResponse;
import com.example.backend.dto.SpecialCollectionDTOs.RescheduleRequest;
import com.example.backend.dto.SpecialCollectionDTOs.PayRequest;
import com.example.backend.dto.SpecialCollectionDTOs.ScheduleRequest;
import com.example.backend.dto.SpecialCollectionDTOs.ScheduleResponse;
import com.example.backend.model.SpecialCollection;
import com.example.backend.service.SpecialCollectionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/special-collection")
public class SpecialCollectionController {

    private final SpecialCollectionService specialCollectionService;

    public SpecialCollectionController(SpecialCollectionService specialCollectionService) {
        this.specialCollectionService = specialCollectionService;
    }

    @GetMapping("/receipt/{id}")
    public ResponseEntity<byte[]> downloadReceipt(HttpServletRequest request, @PathVariable("id") String id) {
        String userId = getUserIdFromCookie(request);
        if (userId == null) return ResponseEntity.status(401).build();
        List<SpecialCollection> list = specialCollectionService.listUserCollections(userId);
        SpecialCollection sc = list.stream().filter(c -> id.equals(c.getId())).findFirst().orElse(null);
        if (sc == null) return ResponseEntity.notFound().build();
        StringBuilder sb = new StringBuilder();
        sb.append("EcoWaste Solutions - Receipt\n");
        sb.append("==============================\n\n");
        sb.append("Collection ID: ").append(sc.getId()).append("\n");
        sb.append("Category: ").append(sc.getCategory()).append("\n");
        sb.append("Items: ").append(sc.getItems()).append("\n");
        sb.append("Quantity (kg): ").append(sc.getQuantity()).append("\n");
        sb.append("Date: ").append(sc.getDate()).append("\n");
        sb.append("Time Slot: ").append(sc.getTimeSlot()).append("\n");
        sb.append("Pickup: ").append(sc.getLocation()).append("\n");
        sb.append("Payment Status: ").append(sc.getPaymentStatus()).append("\n");
        sb.append(String.format("Amount: LKR %.2f\n\n", sc.getFee()));
        sb.append("------------------------------\n");
        sb.append("Thank you for using EcoWaste Solutions.\n");
        byte[] content = sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt-" + sc.getId() + ".txt");
        return ResponseEntity.ok().headers(headers).body(content);
    }

    private String getUserIdFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("SESSIONID".equals(c.getName()) && c.getValue() != null && !c.getValue().isEmpty()) {
                    return c.getValue();
                }
            }
        }
        return null;
    }

    @PostMapping("/fee")
    public ResponseEntity<FeeResponse> calculateFee(@RequestBody FeeRequest req) {
        double fee = specialCollectionService.calculateFee(req);
        FeeResponse res = new FeeResponse();
        res.fee = fee;
        return ResponseEntity.ok(res);
    }

    @GetMapping("/dates")
    public ResponseEntity<List<String>> getDates() {
        return ResponseEntity.ok(specialCollectionService.getAvailableDates(14));
    }

    @GetMapping("/slots")
    public ResponseEntity<List<String>> getSlots(@RequestParam String date) {
        return ResponseEntity.ok(specialCollectionService.getAvailableSlots(date));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<SpecialCollection>> myCollections(HttpServletRequest request) {
        System.out.println("SpecialCollectionController.myCollections() called");
        String userId = getUserIdFromCookie(request);
        System.out.println("User ID from cookie: " + userId);
        
        // For collectors, always return all collections regardless of user ID
        System.out.println("Returning all special collections for collectors");
        List<SpecialCollection> allCollections = specialCollectionService.findAll();
        System.out.println("Found " + allCollections.size() + " special collections for collectors");
        
        // Filter out collections without coordinates for the map
        List<SpecialCollection> collectionsWithCoordinates = allCollections.stream()
            .filter(sc -> sc.getLatitude() != null && sc.getLongitude() != null)
            .collect(Collectors.toList());
        
        System.out.println("Found " + collectionsWithCoordinates.size() + " collections with coordinates");
        return ResponseEntity.ok(collectionsWithCoordinates);
    }

    @GetMapping("/all")
    public ResponseEntity<List<SpecialCollection>> getAllCollections() {
        try {
            List<SpecialCollection> collections = specialCollectionService.findAll();
            System.out.println("Found " + collections.size() + " special collections");
            for (SpecialCollection sc : collections) {
                System.out.println("Collection: " + sc.getId() + " - " + sc.getCategory() + " - Lat: " + sc.getLatitude() + " Lng: " + sc.getLongitude());
            }
            return ResponseEntity.ok(collections);
        } catch (Exception e) {
            System.err.println("Error fetching all special collections: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

	@GetMapping("/list")
	public ResponseEntity<List<SpecialCollection>> listAllCollections() {
		try {
			List<SpecialCollection> collections = specialCollectionService.findAll();
			System.out.println("LIST endpoint - Found " + collections.size() + " special collections");
			return ResponseEntity.ok(collections);
		} catch (Exception e) {
			System.err.println("Error in LIST endpoint: " + e.getMessage());
			return ResponseEntity.status(500).body(null);
		}
	}

	// Find special collection by simple ID (6-digit ID)
	@GetMapping("/find/{id}")
	public ResponseEntity<Map<String, Object>> findSpecialCollectionById(@PathVariable String id) {
		try {
			Optional<SpecialCollection> collection = specialCollectionService.findBySimpleId(id);
			if (collection.isPresent()) {
				Map<String, Object> response = new HashMap<>();
				SpecialCollection collectionData = collection.get();
				String simpleId = collectionData.getId().length() >= 6 ? collectionData.getId().substring(collectionData.getId().length() - 6) : collectionData.getId();
				
				response.put("collectionId", collectionData.getId());
				response.put("simpleId", simpleId);
				response.put("userId", collectionData.getUserId());
				response.put("category", collectionData.getCategory());
				response.put("items", collectionData.getItems());
				response.put("quantity", collectionData.getQuantity());
				response.put("fee", collectionData.getFee());
				response.put("date", collectionData.getDate());
				response.put("timeSlot", collectionData.getTimeSlot());
				response.put("location", collectionData.getLocation());
				response.put("instructions", collectionData.getInstructions());
				response.put("status", collectionData.getStatus());
				response.put("paymentStatus", collectionData.getPaymentStatus());
				response.put("paymentMethod", collectionData.getPaymentMethod());
				response.put("createdAt", collectionData.getCreatedAt());
				response.put("collectedAt", collectionData.getCollectedAt());
				response.put("latitude", collectionData.getLatitude());
				response.put("longitude", collectionData.getLongitude());
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Special collection not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("error", "Error finding special collection: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

    @GetMapping("/test-data")
    public ResponseEntity<String> createTestData() {
        try {
            // Create some test special collection data
            SpecialCollection sc1 = new SpecialCollection();
            sc1.setUserId("test-user");
            sc1.setCategory("Bulky");
            sc1.setItems("Old Sofa");
            sc1.setQuantity(25);
            sc1.setFee(150.0);
            sc1.setDate("2024-01-15");
            sc1.setTimeSlot("Morning");
            sc1.setLocation("456 Test Avenue, Colombo");
            sc1.setLatitude(6.9280);
            sc1.setLongitude(79.8620);
            sc1.setInstructions("Please collect from front door");
            sc1.setStatus("Pending");
            sc1.setPaymentStatus("Unpaid");
            
            SpecialCollection sc2 = new SpecialCollection();
            sc2.setUserId("test-user-2");
            sc2.setCategory("E-Waste");
            sc2.setItems("Old Computer");
            sc2.setQuantity(15);
            sc2.setFee(200.0);
            sc2.setDate("2024-01-16");
            sc2.setTimeSlot("Afternoon");
            sc2.setLocation("789 Test Road, Colombo");
            sc2.setLatitude(6.9290);
            sc2.setLongitude(79.8630);
            sc2.setInstructions("Handle with care");
            sc2.setStatus("Pending");
            sc2.setPaymentStatus("Unpaid");
            
            // Save to repository (assuming we have access to it)
            // For now, just return success message
            return ResponseEntity.ok("Test special collection data would be created here");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating test data: " + e.getMessage());
        }
    }

    @GetMapping("/debug")
    public ResponseEntity<String> debugCollections() {
        try {
            System.out.println("Debug endpoint called");
            List<SpecialCollection> allCollections = specialCollectionService.findAll();
            System.out.println("Debug: Found " + allCollections.size() + " collections");
            
            StringBuilder result = new StringBuilder();
            result.append("Found ").append(allCollections.size()).append(" special collections:\n");
            for (SpecialCollection sc : allCollections) {
                result.append("ID: ").append(sc.getId())
                      .append(", Category: ").append(sc.getCategory())
                      .append(", Lat: ").append(sc.getLatitude())
                      .append(", Lng: ").append(sc.getLongitude())
                      .append("\n");
            }
            
            return ResponseEntity.ok(result.toString());
        } catch (Exception e) {
            System.err.println("Debug error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Debug error: " + e.getMessage());
        }
    }

    @GetMapping("/check-collection")
    public ResponseEntity<String> checkCollection() {
        try {
            System.out.println("Checking MongoDB collection...");
            
            // Try to get collection info
            long count = specialCollectionService.count();
            System.out.println("Collection count: " + count);
            
            // Also try to get all collections to see what's there
            List<SpecialCollection> allCollections = specialCollectionService.findAll();
            System.out.println("All collections size: " + allCollections.size());
            
            return ResponseEntity.ok("Collection count: " + count + ", All collections: " + allCollections.size());
        } catch (Exception e) {
            System.err.println("Collection check error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Collection check error: " + e.getMessage());
        }
    }

    @PostMapping("/schedule")
    public ResponseEntity<?> schedule(HttpServletRequest request, @RequestBody ScheduleRequest req) {
        String userId = getUserIdFromCookie(request);
        if (userId == null) return ResponseEntity.status(401).body("Not authenticated");
        
        // Debug: Log the payment method received in controller
        System.out.println("CONTROLLER DEBUG: Received paymentMethod: " + req.paymentMethod);
        System.out.println("CONTROLLER DEBUG: PaymentMethod is null: " + (req.paymentMethod == null));
        
        SpecialCollection sc = specialCollectionService.schedule(userId, req);
        ScheduleResponse res = new ScheduleResponse();
        res.collectionId = sc.getId();
        res.fee = sc.getFee();
        res.status = sc.getStatus();
        res.paymentStatus = sc.getPaymentStatus();
        return ResponseEntity.ok(res);
    }

    @PostMapping("/reschedule/{id}")
    public ResponseEntity<SpecialCollection> reschedule(HttpServletRequest request, @PathVariable("id") String id,
                                                        @RequestBody RescheduleRequest req) {
        String userId = getUserIdFromCookie(request);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(specialCollectionService.reschedule(userId, id, req.date, req.timeSlot));
    }

    @PostMapping("/pay/{id}")
    public ResponseEntity<?> markPaid(HttpServletRequest request, @PathVariable("id") String id, @RequestBody(required = false) PayRequest payRequest) {
        String userId = getUserIdFromCookie(request);
        if (userId == null) return ResponseEntity.status(401).build();
        SpecialCollection sc;
        String method = payRequest != null && payRequest.method != null ? payRequest.method.toLowerCase() : "card";
        Boolean success = payRequest != null ? payRequest.success : Boolean.TRUE;
        if ("cash".equals(method)) {
            sc = specialCollectionService.markCashPending(userId, id);
        } else if (Boolean.TRUE.equals(success)) {
            sc = specialCollectionService.markPaid(userId, id);
        } else {
            sc = specialCollectionService.markUnpaid(userId, id, method);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("status", sc.getStatus());
        res.put("paymentStatus", sc.getPaymentStatus());
        return ResponseEntity.ok(res);
    }

	// Update payment status by simple ID
	@PutMapping("/{id}/payment-status")
	public ResponseEntity<Map<String, Object>> updatePaymentStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
		try {
			String newPaymentStatus = request.get("paymentStatus");
			if (newPaymentStatus == null) {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Payment status is required");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
			}

			Optional<SpecialCollection> collectionOpt = specialCollectionService.findBySimpleId(id);
			if (collectionOpt.isPresent()) {
				SpecialCollection collection = collectionOpt.get();
				collection.setPaymentStatus(newPaymentStatus);
				SpecialCollection updatedCollection = specialCollectionService.update(collection);
				
				String simpleId = updatedCollection.getId().length() >= 6 ? updatedCollection.getId().substring(updatedCollection.getId().length() - 6) : updatedCollection.getId();
				Map<String, Object> response = new HashMap<>();
				response.put("collectionId", updatedCollection.getId());
				response.put("simpleId", simpleId);
				response.put("paymentStatus", updatedCollection.getPaymentStatus());
				response.put("message", "Payment status updated successfully");
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Collection not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("error", "Error updating payment status: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Update collection status by simple ID
	@PutMapping("/{id}/status")
	public ResponseEntity<Map<String, Object>> updateCollectionStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
		try {
			String newStatus = request.get("status");
			if (newStatus == null) {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Status is required");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
			}

			Optional<SpecialCollection> collectionOpt = specialCollectionService.findBySimpleId(id);
			if (collectionOpt.isPresent()) {
				SpecialCollection collection = collectionOpt.get();
				collection.setStatus(newStatus);
				
				// If marking as collected, set collectedAt timestamp
				if ("Collected".equals(newStatus)) {
					collection.setCollectedAt(java.time.LocalDateTime.now());
				}
				
				SpecialCollection updatedCollection = specialCollectionService.update(collection);
				
				String simpleId = updatedCollection.getId().length() >= 6 ? updatedCollection.getId().substring(updatedCollection.getId().length() - 6) : updatedCollection.getId();
				Map<String, Object> response = new HashMap<>();
				response.put("collectionId", updatedCollection.getId());
				response.put("simpleId", simpleId);
				response.put("status", updatedCollection.getStatus());
				response.put("collectedAt", updatedCollection.getCollectedAt());
				response.put("message", "Collection status updated successfully");
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else {
				Map<String, Object> errorResponse = new HashMap<>();
				errorResponse.put("error", "Collection not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("error", "Error updating collection status: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping("/cancel/{id}")
	public ResponseEntity<?> cancelCollection(HttpServletRequest request, @PathVariable("id") String id) {
        String userId = getUserIdFromCookie(request);
        if (userId == null) return ResponseEntity.status(401).build();
        try {
            SpecialCollection sc = specialCollectionService.cancelCollection(userId, id);
            Map<String, Object> res = new HashMap<>();
            res.put("status", "Deleted");
            res.put("message", "Collection cancelled and deleted successfully");
            res.put("deletedId", sc.getId());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/qr/{id}")
    public ResponseEntity<byte[]> downloadQRCode(HttpServletRequest request, @PathVariable("id") String id) {
        System.out.println("QR download endpoint called for collection: " + id);
        String userId = getUserIdFromCookie(request);
        System.out.println("User ID from cookie: " + userId);
        if (userId == null) {
            System.out.println("No user ID found, returning 401");
            return ResponseEntity.status(401).build();
        }
        
        try {
            System.out.println("Generating QR code bytes...");
            byte[] qrCodeBytes = specialCollectionService.generateQRCodeBytes(id, userId);
            System.out.println("QR code bytes generated successfully, length: " + qrCodeBytes.length);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=qr-code-" + id + ".png");
            return ResponseEntity.ok().headers(headers).body(qrCodeBytes);
        } catch (Exception e) {
            System.err.println("Error in QR download endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/qr-base64/{id}")
    public ResponseEntity<Map<String, String>> getQRCodeBase64(HttpServletRequest request, @PathVariable("id") String id) {
        System.out.println("QR base64 endpoint called for collection: " + id);
        String userId = getUserIdFromCookie(request);
        System.out.println("User ID from cookie: " + userId);
        if (userId == null) {
            System.out.println("No user ID found, returning 401");
            return ResponseEntity.status(401).build();
        }
        
        try {
            System.out.println("Generating QR code base64...");
            String qrCodeBase64 = specialCollectionService.generateQRCodeBase64(id, userId);
            System.out.println("QR code generated successfully, length: " + qrCodeBase64.length());
            Map<String, String> response = new HashMap<>();
            response.put("qrCode", qrCodeBase64);
            response.put("collectionId", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in QR base64 endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/scan-qr")
    public ResponseEntity<?> scanQRCode(@RequestBody Map<String, String> request) {
        try {
            String qrCodeData = request.get("qrCodeData");
            if (qrCodeData == null || qrCodeData.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "QR code data is required"));
            }
            
            SpecialCollection sc = specialCollectionService.markCollected(qrCodeData);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Collection marked as collected successfully");
            response.put("collectionId", sc.getId());
            response.put("status", sc.getStatus());
            response.put("collectedAt", sc.getCollectedAt());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}


