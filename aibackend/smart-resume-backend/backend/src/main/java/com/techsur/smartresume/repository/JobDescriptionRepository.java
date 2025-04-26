package com.techsur.smartresume.repository;

import com.techsur.smartresume.model.JobDescription;
import com.techsur.smartresume.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescription, Long> {
    List<JobDescription> findByUser(User user);
} 