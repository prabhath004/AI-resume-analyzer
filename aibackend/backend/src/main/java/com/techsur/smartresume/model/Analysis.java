// src/main/java/com/techsur/smartresume/model/Analysis.java
package com.techsur.smartresume.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "analyses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @ToString
public class Analysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Candidate info
    private String candidateName;
    private String candidateEmail;
    private String phoneNumber;

    // Resume path
    private String resumePath;

    // ATS Scores
    private Double overallFitScore;
    private Double semanticScore;
    private Double tfidfScore;
    private Double skillScore;
    private Double experienceScore;
    private Double educationScore;

    // Skills matching
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "analysis_matched_skills", joinColumns = @JoinColumn(name = "analysis_id"))
    @Column(name = "skill")
    private Set<String> matchedSkills;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "analysis_missing_skills", joinColumns = @JoinColumn(name = "analysis_id"))
    @Column(name = "skill")
    private Set<String> missingSkills;

    // Overall experience summary
    private String experience;

    // Structured Education Details
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "analysis_education_details", joinColumns = @JoinColumn(name = "analysis_id"))
    private List<EducationDetail> educationDetails;

    // Work experience entries
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "analysis_work_experiences", joinColumns = @JoinColumn(name = "analysis_id"))
    private List<WorkExperience> workExperiences;

    // Text insights
    private String fitCategory;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String fitExplanation;

    // Strengths & Weaknesses
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "analysis_strengths", joinColumns = @JoinColumn(name = "analysis_id"))
    @Column(name = "strength")
    private Set<String> strengths;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "analysis_weaknesses", joinColumns = @JoinColumn(name = "analysis_id"))
    @Column(name = "weakness")
    private Set<String> weaknesses;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
