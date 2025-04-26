package com.techsur.smartresume.service;

import com.techsur.smartresume.model.JobDescription;
import com.techsur.smartresume.model.User;
import com.techsur.smartresume.repository.JobDescriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class JobService {
    private static final Logger logger = LoggerFactory.getLogger(JobService.class);

    @Autowired
    private JobDescriptionRepository jobDescriptionRepository;

    public JobDescription createJob(JobDescription jobDescription, User user) {
        if (user != null) {
            jobDescription.setUser(user);
        }
        jobDescription.setCreatedAt(LocalDateTime.now());
        jobDescription.setActive(true);
        
        JobDescription savedJob = jobDescriptionRepository.save(jobDescription);
        logger.info("Created new job description with ID: {}", savedJob.getId());
        return savedJob;
    }

    public List<JobDescription> getAllJobsByUser(User user) {
        if (user == null) {
            return jobDescriptionRepository.findAll();
        }
        return jobDescriptionRepository.findByUser(user);
    }

    public JobDescription getJobById(Long id, User user) {
        JobDescription job = jobDescriptionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Job description not found"));

        if (user != null && !job.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Not authorized to access this job description");
        }

        return job;
    }

    public JobDescription updateJob(Long id, JobDescription jobDetails, User user) {
        JobDescription job = getJobById(id, user);

        job.setTitle(jobDetails.getTitle());
        job.setCompany(jobDetails.getCompany());
        job.setDescription(jobDetails.getDescription());
        job.setRequirements(jobDetails.getRequirements());
        job.setResponsibilities(jobDetails.getResponsibilities());
        job.setLocation(jobDetails.getLocation());
        job.setEmploymentType(jobDetails.getEmploymentType());
        job.setExperienceLevel(jobDetails.getExperienceLevel());
        job.setKeywordTags(jobDetails.getKeywordTags());
        job.setAnalyzedSkills(jobDetails.getAnalyzedSkills());
        job.setActive(jobDetails.getActive());
        job.setUpdatedAt(LocalDateTime.now());

        JobDescription updatedJob = jobDescriptionRepository.save(job);
        logger.info("Updated job description with ID: {}", updatedJob.getId());
        return updatedJob;
    }

    public void deleteJob(Long id, User user) {
        JobDescription job = getJobById(id, user);
        jobDescriptionRepository.delete(job);
        logger.info("Deleted job description with ID: {}", id);
    }
} 