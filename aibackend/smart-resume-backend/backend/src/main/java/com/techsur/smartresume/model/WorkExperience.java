package com.techsur.smartresume.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class WorkExperience {
    private String title;
    private String company;
    private String startDate;
    private String endDate;
    private String description;
    private Boolean current;
}
