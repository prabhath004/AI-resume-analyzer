DROP TABLE IF EXISTS resume_analyses;

CREATE TABLE resume_analyses (
    id BIGSERIAL PRIMARY KEY,
    hr_user_id BIGINT NOT NULL,
    candidate_first_name VARCHAR(255),
    candidate_last_name VARCHAR(255),
    resume_text TEXT,
    analysis_result TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (hr_user_id) REFERENCES users(id)
); 