// src/main/java/com/techsur/smartresume/payload/ResumeAnalysisResponse.java
package com.techsur.smartresume.payload;

import com.techsur.smartresume.model.Analysis;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysisResponse {

    private Long id;
    private LocalDateTime createdAt;

    // Candidate contact info
    private String candidateName;
    private String candidateEmail;
    private String phoneNumber;

    // Resume file path
    private String resumePath;

    // Scores
    private Double overallFitScore;
    private Double semanticScore;
    private Double tfidfScore;
    private Double skillScore;
    private Double experienceScore;
    private Double educationScore;

    // Skills
    private Set<String> matchedSkills;
    private Set<String> missingSkills;

    // Experience
    private String experience;

    // Structured Education Details
    private List<EducationDetailResponse> educationDetails;

    private List<WorkExperienceResponse> workExperiences;

    // Descriptive fields
    private String summary;
    private String fitCategory;
    private String fitExplanation;

    // AI-assessed traits
    private Set<String> strengths;
    private Set<String> weaknesses;

    /**
     * Convert JPA Entity → Response DTO
     */
    public static ResumeAnalysisResponse fromEntity(Analysis a) {
        ResumeAnalysisResponse dto = new ResumeAnalysisResponse();

        dto.setId(a.getId());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setCandidateName(a.getCandidateName());
        dto.setCandidateEmail(a.getCandidateEmail());
        dto.setPhoneNumber(a.getPhoneNumber());
        dto.setResumePath(a.getResumePath());

        dto.setOverallFitScore(a.getOverallFitScore());
        dto.setSemanticScore(a.getSemanticScore());
        dto.setTfidfScore(a.getTfidfScore());
        dto.setSkillScore(a.getSkillScore());
        dto.setExperienceScore(a.getExperienceScore());
        dto.setEducationScore(a.getEducationScore());

        dto.setMatchedSkills(a.getMatchedSkills());
        dto.setMissingSkills(a.getMissingSkills());

        dto.setExperience(a.getExperience());

        // map structured educationDetails
        if (a.getEducationDetails() != null) {
            dto.setEducationDetails(
                a.getEducationDetails().stream()
                  .map(EducationDetailResponse::fromEntity)
                  .collect(Collectors.toList())
            );
        }

        if (a.getWorkExperiences() != null) {
            dto.setWorkExperiences(
                a.getWorkExperiences().stream()
                  .map(WorkExperienceResponse::fromEntity)
                  .collect(Collectors.toList())
            );
        }

        dto.setSummary(a.getSummary());
        dto.setFitCategory(a.getFitCategory());
        dto.setFitExplanation(a.getFitExplanation());
        dto.setStrengths(a.getStrengths());
        dto.setWeaknesses(a.getWeaknesses());

        return dto;
    }
}