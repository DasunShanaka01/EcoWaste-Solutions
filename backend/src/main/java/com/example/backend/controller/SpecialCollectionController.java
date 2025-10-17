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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        String userId = getUserIdFromCookie(request);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(specialCollectionService.listUserCollections(userId));
    }

    @PostMapping("/schedule")
    public ResponseEntity<?> schedule(HttpServletRequest request, @RequestBody ScheduleRequest req) {
        String userId = getUserIdFromCookie(request);
        if (userId == null) return ResponseEntity.status(401).body("Not authenticated");
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
}


