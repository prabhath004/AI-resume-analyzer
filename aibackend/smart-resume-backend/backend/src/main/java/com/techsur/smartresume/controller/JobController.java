package com.techsur.smartresume.controller;

import com.techsur.smartresume.model.JobDescription;
import com.techsur.smartresume.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class JobController {

    @Autowired
    private JobService jobService;

    @PostMapping
    public ResponseEntity<JobDescription> createJob(@RequestBody JobDescription jobDescription) {
        JobDescription savedJob = jobService.createJob(jobDescription, null);
        return ResponseEntity.ok(savedJob);
    }

    @GetMapping
    public ResponseEntity<List<JobDescription>> getAllJobs() {
        List<JobDescription> jobs = jobService.getAllJobsByUser(null);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDescription> getJob(@PathVariable Long id) {
        JobDescription job = jobService.getJobById(id, null);
        return ResponseEntity.ok(job);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobDescription> updateJob(
            @PathVariable Long id,
            @RequestBody JobDescription jobDescription) {
        JobDescription updatedJob = jobService.updateJob(id, jobDescription, null);
        return ResponseEntity.ok(updatedJob);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id, null);
        return ResponseEntity.ok().build();
    }
} 