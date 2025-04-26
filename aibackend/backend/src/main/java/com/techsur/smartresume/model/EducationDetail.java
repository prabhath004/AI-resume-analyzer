package com.techsur.smartresume.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;

/**
 * Embeddable representing a single education entry:
 * - institution name
 * - degree description
 * - start and end dates
 * - isCurrent flag if ongoing
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class EducationDetail {
    private String institution;
    private String degree;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isCurrent;
}
