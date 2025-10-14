package com.example.backend.config;

import java.util.Date;
import java.security.Key; 
import java.time.Duration; 

import org.springframework.stereotype.Component;
import io.jsonwebtoken.security.Keys; 
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Component
public class JwtUtil {
     private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    public String generateToken(String userId, Duration ttl) {
        long now = System.currentTimeMillis();
        Date exp = new Date(now + ttl.toMillis());
        return Jwts.builder()
            .setSubject(userId)
            .setIssuedAt(new Date(now))
            .setExpiration(exp)
            .signWith(key)
            .compact();
    }

    public String extractUserId(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
            .parseClaimsJws(token).getBody().getSubject();
    }
}
