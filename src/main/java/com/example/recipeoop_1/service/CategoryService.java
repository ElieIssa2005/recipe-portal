package com.example.recipeoop_1.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final MongoTemplate mongoTemplate;

    @Autowired
    public CategoryService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public List<String> getAllCategories() {
        // Only return collections that have at least one document
        return mongoTemplate.getCollectionNames().stream()
                .filter(name -> name.startsWith("recipe_"))
                .filter(name -> mongoTemplate.getCollection(name).countDocuments() > 0) // Only non-empty collections
                .map(name -> name.substring("recipe_".length()))
                .collect(Collectors.toList());
    }

    public void ensureCategoryExists(String category) {
        String collectionName = formatCollectionName(category);
        if (!mongoTemplate.collectionExists(collectionName)) {
            mongoTemplate.createCollection(collectionName);
        }
    }

    /**
     * Delete a category if it's empty
     */
    public void deleteIfEmpty(String category) {
        String collectionName = formatCollectionName(category);
        if (mongoTemplate.collectionExists(collectionName)) {
            // Check if collection is empty
            if (mongoTemplate.getCollection(collectionName).countDocuments() == 0) {
                // Drop the empty collection
                mongoTemplate.dropCollection(collectionName);
            }
        }
    }

    public static String formatCollectionName(String category) {
        // Convert category to a valid MongoDB collection name
        String formatted = category.toLowerCase().trim().replaceAll("\\s+", "_");
        return "recipe_" + formatted;
    }
}