package com.techsur.smartresume.service;

import com.techsur.smartresume.model.JobDescription;
import com.techsur.smartresume.model.Resume;
import com.techsur.smartresume.model.User;
import com.techsur.smartresume.model.WorkExperience;
import com.techsur.smartresume.payload.ResumeAnalysisResponse;
import com.techsur.smartresume.payload.WorkExperienceResponse;
import com.techsur.smartresume.repository.JobDescriptionRepository;
import com.techsur.smartresume.repository.ResumeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResumeService {
    private static final Logger logger = LoggerFactory.getLogger(ResumeService.class);

    @Autowired private ResumeRepository resumeRepository;
    @Autowired private JobDescriptionRepository jobDescriptionRepository;

    private final RestTemplate restTemplate;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    public ResumeService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(30))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
    }

    @Retryable(value = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public ResumeAnalysisResponse processAndAnalyzeResume(MultipartFile file, Long jobDescriptionId, User user) {
        try {
            // Step 1: Store file
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("Uploaded file is empty");
            }
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) Files.createDirectories(dir);

            String storedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path storedPath = dir.resolve(storedName);
            Files.copy(file.getInputStream(), storedPath, StandardCopyOption.REPLACE_EXISTING);

            // Step 2: Call AI API
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("resume", new FileSystemResource(storedPath));

            String jdText = jobDescriptionId != null
                    ? jobDescriptionRepository.findById(jobDescriptionId)
                        .map(JobDescription::getDescription)
                        .orElse("No job description provided.")
                    : "No job description provided.";
            body.add("job_description", jdText);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ResponseEntity<ResumeAnalysisResponse> aiResponse = restTemplate.exchange(
                    aiServiceUrl + "/api/v1/analyze",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    ResumeAnalysisResponse.class
            );

            ResumeAnalysisResponse analysis = aiResponse.getBody();
            if (analysis == null) throw new RuntimeException("AI analysis returned empty result");

            // Step 3: Map and save
            Resume resume = new Resume();
            resume.setUser(user);
            resume.setFileName(storedName);
            resume.setFilePath(storedPath.toString());
            resume.setFileType(file.getContentType());
            resume.setFileSize(file.getSize());
            resume.setUploadedAt(LocalDateTime.now());
            resume.setAnalyzedAt(LocalDateTime.now());
            resume.setStatus("COMPLETED");

            resume.setCandidateName(analysis.getCandidateName());
            resume.setCandidateEmail(analysis.getCandidateEmail());
            resume.setPhoneNumber(analysis.getPhoneNumber());
            resume.setAnalysisResult(analysis.toString());

            resume.setMatchedSkillsList(new ArrayList<>(analysis.getMatchedSkills()));
            resume.setMissingSkillsList(new ArrayList<>(analysis.getMissingSkills()));
            resume.setStrengthsList(new ArrayList<>(analysis.getStrengths()));
            resume.setWeaknessesList(new ArrayList<>(analysis.getWeaknesses()));

            // Convert WorkExperienceResponse → WorkExperience model
            List<WorkExperience> workExperiences = analysis.getWorkExperiences()
                    .stream()
                    .map(WorkExperienceResponse::toEntity)
                    .collect(Collectors.toList());
            resume.setWorkExperiencesList(workExperiences);

            resume.setSummary(analysis.getSummary());
            resume.setFitExplanation(analysis.getFitExplanation());

            if (jobDescriptionId != null) {
                JobDescription jd = jobDescriptionRepository.findById(jobDescriptionId)
                        .orElseThrow(() -> new RuntimeException("Job description not found"));
                resume.setJobDescription(jd);
            }

            resumeRepository.save(resume);
            return analysis;

        } catch (IOException | HttpClientErrorException | ResourceAccessException ex) {
            logger.error("Failed to process resume: {}", ex.getMessage(), ex);
            throw new RuntimeException("Resume processing failed", ex);
        }
    }

    public List<Resume> getAllResumesByUser(User user) {
        return resumeRepository.findByUser(user);
    }

    public Resume getResumeById(Long id, User user) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        if (!resume.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied");
        }
        return resume;
    }

    public void deleteResume(Long id, User user) {
        Resume resume = getResumeById(id, user);
        try {
            Files.deleteIfExists(Paths.get(resume.getFilePath()));
        } catch (IOException e) {
            logger.warn("File deletion failed: {}", resume.getFilePath(), e);
        }
        resumeRepository.delete(resume);
    }

    public Map<String, Object> getDashboardStats(User user) {
        List<Resume> allResumes = getAllResumesByUser(user);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalResumes", allResumes.size());

        if (!allResumes.isEmpty()) {
            DoubleSummaryStatistics scoreStats = allResumes.stream()
                    .map(Resume::getOverallFitScore)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .summaryStatistics();

            stats.put("averageScore", scoreStats.getAverage());
            stats.put("highestScore", scoreStats.getMax());
            stats.put("lowestScore", scoreStats.getMin());

            Map<String, Long> frequency = allResumes.stream()
                    .flatMap(r -> r.getMatchedSkillsList().stream())
                    .collect(Collectors.groupingBy(s -> s, Collectors.counting()));

            List<String> topSkills = frequency.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(10)
                    .map(Map.Entry::getKey)
                    .toList();

            stats.put("topSkills", topSkills);
        } else {
            stats.put("averageScore", 0.0);
            stats.put("highestScore", 0.0);
            stats.put("lowestScore", 0.0);
            stats.put("topSkills", Collections.emptyList());
        }

        return stats;
    }
}
