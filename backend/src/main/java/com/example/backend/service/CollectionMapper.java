package com.example.backend.service;

import com.example.backend.dto.CollectionRequestDTO;
import com.example.backend.model.Collection;
import org.springframework.stereotype.Component;

/**
 * Service responsible for mapping between DTOs and entities
 * Single Responsibility: Data mapping between layers
 */
@Component
public class CollectionMapper {
    
    /**
     * Maps CollectionRequestDTO to Collection entity
     */
    public Collection toEntity(CollectionRequestDTO request) {
        if (request == null) {
            return null;
        }
        
        Collection.Location location = null;
        if (request.getLocation() != null) {
            location = new Collection.Location(
                request.getLocation().getLatitude(),
                request.getLocation().getLongitude(),
                request.getLocation().getAddress()
            );
        }
        
        return new Collection(
            request.getAccountId(),
            request.getAccountHolder(),
            request.getAddress(),
            request.getWeight(),
            request.getWasteType(),
            location,
            request.getCollectorId()
        );
    }
    
    /**
     * Maps Collection entity to CollectionRequestDTO
     */
    public CollectionRequestDTO toDTO(Collection collection) {
        if (collection == null) {
            return null;
        }
        
        CollectionRequestDTO.LocationDTO locationDTO = null;
        if (collection.getLocation() != null) {
            locationDTO = new CollectionRequestDTO.LocationDTO(
                collection.getLocation().getLatitude(),
                collection.getLocation().getLongitude(),
                collection.getLocation().getAddress()
            );
        }
        
        return new CollectionRequestDTO(
            collection.getAccountId(),
            collection.getAccountHolder(),
            collection.getAddress(),
            collection.getWeight(),
            collection.getWasteType(),
            locationDTO,
            collection.getCollectorId()
        );
    }
}
