package com.techsur.smartresume.payload;

import com.techsur.smartresume.model.Analysis;
import com.techsur.smartresume.payload.EducationDetailResponse;
import com.techsur.smartresume.payload.WorkExperienceResponse;

import com.techsur.smartresume.model.EducationDetail;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EducationDetailResponse {
    private String institution;
    private String degree;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isCurrent;

    /**
     * Map model → DTO
     */
    public static EducationDetailResponse fromEntity(EducationDetail ed) {
        EducationDetailResponse resp = new EducationDetailResponse();
        resp.setInstitution(ed.getInstitution());
        resp.setDegree(ed.getDegree());
        resp.setStartDate(ed.getStartDate());
        resp.setEndDate(ed.getEndDate());
        resp.setCurrent(ed.isCurrent());
        return resp;
    }

    /**
     * Map DTO → model
     */
    public EducationDetail toEntity() {
        EducationDetail ed = new EducationDetail();
        ed.setInstitution(this.getInstitution());
        ed.setDegree(this.getDegree());
        ed.setStartDate(this.getStartDate());
        ed.setEndDate(this.getEndDate());
        ed.setCurrent(this.isCurrent());
        return ed;
    }
}
