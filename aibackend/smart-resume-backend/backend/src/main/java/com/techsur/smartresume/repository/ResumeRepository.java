package com.techsur.smartresume.repository;

import com.techsur.smartresume.model.Resume;
import com.techsur.smartresume.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByUser(User user);
} 