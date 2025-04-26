-- Create database if not exists
CREATE DATABASE IF NOT EXISTS smart_resume;

-- Connect to the database
\c smart_resume;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'HR_USER',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create job_descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    experience_required VARCHAR(255),
    education_required VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL REFERENCES users(id)
);

-- Create table for job description required skills
CREATE TABLE IF NOT EXISTS job_description_required_skills (
    job_description_id BIGINT NOT NULL REFERENCES job_descriptions(id),
    required_skills VARCHAR(255) NOT NULL,
    PRIMARY KEY (job_description_id, required_skills)
);

-- Create table for job description preferred skills
CREATE TABLE IF NOT EXISTS job_description_preferred_skills (
    job_description_id BIGINT NOT NULL REFERENCES job_descriptions(id),
    preferred_skills VARCHAR(255) NOT NULL,
    PRIMARY KEY (job_description_id, preferred_skills)
);

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id BIGSERIAL PRIMARY KEY,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    current_position VARCHAR(255),
    current_company VARCHAR(255),
    extracted_text TEXT,
    overall_fit_score DOUBLE PRECISION,
    semantic_score DOUBLE PRECISION,
    tfidf_score DOUBLE PRECISION,
    skill_score DOUBLE PRECISION,
    experience_score DOUBLE PRECISION,
    education_score DOUBLE PRECISION,
    experience VARCHAR(255),
    fit_category VARCHAR(50),
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL REFERENCES users(id),
    job_description_id BIGINT REFERENCES job_descriptions(id)
);

-- Create table for resume matched skills
CREATE TABLE IF NOT EXISTS resume_matched_skills (
    resume_id BIGINT NOT NULL REFERENCES resumes(id),
    matched_skills VARCHAR(255) NOT NULL,
    PRIMARY KEY (resume_id, matched_skills)
);

-- Create table for resume missing skills
CREATE TABLE IF NOT EXISTS resume_missing_skills (
    resume_id BIGINT NOT NULL REFERENCES resumes(id),
    missing_skills VARCHAR(255) NOT NULL,
    PRIMARY KEY (resume_id, missing_skills)
);

-- Create table for resume education
CREATE TABLE IF NOT EXISTS resume_education (
    resume_id BIGINT NOT NULL REFERENCES resumes(id),
    education VARCHAR(255) NOT NULL,
    PRIMARY KEY (resume_id, education)
);

-- Create table for resume certifications
CREATE TABLE IF NOT EXISTS resume_certifications (
    resume_id BIGINT NOT NULL REFERENCES resumes(id),
    certifications VARCHAR(255) NOT NULL,
    PRIMARY KEY (resume_id, certifications)
);

-- Create table for resume languages
CREATE TABLE IF NOT EXISTS resume_languages (
    resume_id BIGINT NOT NULL REFERENCES resumes(id),
    languages VARCHAR(255) NOT NULL,
    PRIMARY KEY (resume_id, languages)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_job_description_id ON resumes(job_description_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_id ON job_descriptions(user_id); 