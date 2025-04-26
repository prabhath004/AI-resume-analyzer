// src/main/java/com/techsur/smartresume/controller/AnalysisController.java
package com.techsur.smartresume.controller;

import com.techsur.smartresume.model.Analysis;
import com.techsur.smartresume.payload.EducationDetailResponse;
import com.techsur.smartresume.payload.ResumeAnalysisResponse;
import com.techsur.smartresume.payload.WorkExperienceResponse;
import com.techsur.smartresume.repository.AnalysisRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for managing resume analysis records.
 */
@Slf4j
@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    @Autowired
    private AnalysisRepository repo;

    @Autowired
    private SimpMessagingTemplate ws;

    /**
     * Save a new resume analysis record to the database.
     *
     * @param dto ResumeAnalysisResponse from AI
     * @return ResumeAnalysisResponse that was saved
     */
    @PostMapping
    public ResumeAnalysisResponse saveAnalysis(@RequestBody ResumeAnalysisResponse dto) {
        log.info("Received analysis DTO: {}", dto);

        Analysis entity = Analysis.builder()
            .candidateName(dto.getCandidateName())
            .candidateEmail(dto.getCandidateEmail())
            .phoneNumber(dto.getPhoneNumber())
            .resumePath(dto.getResumePath())

            .overallFitScore(dto.getOverallFitScore())
            .semanticScore(dto.getSemanticScore())
            .tfidfScore(dto.getTfidfScore())
            .skillScore(dto.getSkillScore())
            .experienceScore(dto.getExperienceScore())
            .educationScore(dto.getEducationScore())

            .matchedSkills(dto.getMatchedSkills())
            .missingSkills(dto.getMissingSkills())

            .experience(dto.getExperience())

            // map structured educationDetails
            .educationDetails(dto.getEducationDetails() != null ?
                dto.getEducationDetails().stream()
                    .map(EducationDetailResponse::toEntity)
                    .collect(Collectors.toList())
                : List.of()
            )

            .workExperiences(dto.getWorkExperiences() != null ?
                dto.getWorkExperiences().stream()
                    .map(WorkExperienceResponse::toEntity)
                    .collect(Collectors.toList())
                : List.of()
            )

            .summary(dto.getSummary())
            .fitCategory(dto.getFitCategory())
            .fitExplanation(dto.getFitExplanation())

            .strengths(dto.getStrengths())
            .weaknesses(dto.getWeaknesses())

            .build();

        Analysis saved = repo.save(entity);
        ResumeAnalysisResponse response = ResumeAnalysisResponse.fromEntity(saved);
        log.info("Saved analysis with ID {}", response.getId());

        // broadcast via WebSocket
        ws.convertAndSend("/topic/analyses", response);
        return response;
    }

    /**
     * Fetch all stored analyses as DTOs.
     *
     * @return list of all analysis entries
     */
    @GetMapping
    public List<ResumeAnalysisResponse> getAllAnalyses() {
        return repo.findAll().stream()
                   .map(ResumeAnalysisResponse::fromEntity)
                   .collect(Collectors.toList());
    }

    /**
     * Delete a specific analysis entry by ID.
     *
     * @param id Analysis ID
     * @return 200 OK if deleted, 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnalysis(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            log.warn("Analysis not found: {}", id);
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        log.info("Deleted analysis with ID {}", id);
        return ResponseEntity.ok().build();
    }

    /**
     * Simple health check endpoint.
     *
     * @return "healthy" response
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Spring Boot API is healthy");
    }
}
