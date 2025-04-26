package com.techsur.smartresume.model;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "resumes")
public class Resume {
    private static final Logger logger = LoggerFactory.getLogger(Resume.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ------------------ File Metadata ------------------
    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath;

    private String fileType;
    private Long fileSize;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @Column(columnDefinition = "TEXT")
    private String analysisResult;

    // ------------------ ATS Scores ------------------
    private Double overallFitScore;
    private Double semanticScore;
    private Double tfidfScore;
    private Double skillScore;
    private Double experienceScore;
    private Double educationScore;

    // ------------------ Contact Info ------------------
    private String candidateName;
    private String candidateEmail;
    private String phoneNumber;

    // ------------------ Timestamps & Status ------------------
    @Column(nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    private LocalDateTime analyzedAt;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    // ------------------ Relationships ------------------
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_description_id")
    private JobDescription jobDescription;

    // ------------------ Free-form Text Fields ------------------
    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String fitExplanation;

    // ------------------ JSON-Backed Fields ------------------
    @Column(columnDefinition = "TEXT")
    private String matchedSkillsJson;

    @Column(columnDefinition = "TEXT")
    private String missingSkillsJson;

    @Column(columnDefinition = "TEXT")
    private String strengthsJson;

    @Column(columnDefinition = "TEXT")
    private String weaknessesJson;

    @Column(columnDefinition = "TEXT")
    private String workExperiencesJson;

    // ------------------ Transient JSON Accessors ------------------

    @Transient
    public List<String> getMatchedSkillsList() {
        return fromJson(matchedSkillsJson, new TypeReference<List<String>>() {});
    }
    public void setMatchedSkillsList(List<String> list) {
        this.matchedSkillsJson = toJson(list);
    }

    @Transient
    public List<String> getMissingSkillsList() {
        return fromJson(missingSkillsJson, new TypeReference<List<String>>() {});
    }
    public void setMissingSkillsList(List<String> list) {
        this.missingSkillsJson = toJson(list);
    }

    @Transient
    public List<String> getStrengthsList() {
        return fromJson(strengthsJson, new TypeReference<List<String>>() {});
    }
    public void setStrengthsList(List<String> list) {
        this.strengthsJson = toJson(list);
    }

    @Transient
    public List<String> getWeaknessesList() {
        return fromJson(weaknessesJson, new TypeReference<List<String>>() {});
    }
    public void setWeaknessesList(List<String> list) {
        this.weaknessesJson = toJson(list);
    }

    @Transient
    public List<WorkExperience> getWorkExperiencesList() {
        return fromJson(workExperiencesJson, new TypeReference<List<WorkExperience>>() {});
    }
    public void setWorkExperiencesList(List<WorkExperience> list) {
        this.workExperiencesJson = toJson(list);
    }

    // ------------------ JSON (De)serialization Helpers ------------------

    private <T> List<T> fromJson(String json, TypeReference<List<T>> type) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return JSON.readValue(json, type);
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse JSON to {}: {}", type, e.getMessage());
            return new ArrayList<>();
        }
    }

    private String toJson(Object list) {
        try {
            return JSON.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize to JSON: {}", e.getMessage());
            return "[]";
        }
    }
}
