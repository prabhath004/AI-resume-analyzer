package com.techsur.smartresume.payload;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.techsur.smartresume.model.WorkExperience;
import lombok.*;

/**
 * DTO representing a single work experience for API responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkExperienceResponse {

    private String title;
    private String company;
    private String startDate;  // Format: yyyy-MM-dd
    private String endDate;

    /**
     * Whether this is the candidate's current position.
     */
    @JsonProperty("current")
    private Boolean current;

    /**
     * Convert model entity → DTO.
     */
    public static WorkExperienceResponse fromEntity(WorkExperience we) {
        return WorkExperienceResponse.builder()
                .title(we.getTitle())
                .company(we.getCompany())
                .startDate(we.getStartDate())
                .endDate(we.getEndDate())
                .current(we.getCurrent())  // ✅

                .build();
    }

    /**
     * Convert DTO → model entity.
     */
    public WorkExperience toEntity() {
        return new WorkExperience(
                this.title,
                this.company,
                this.startDate,
                this.endDate,
                null,         // description can be added if needed
                Boolean.TRUE.equals(this.current) // prevent NPE
        );
    }
}
