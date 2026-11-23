// src/pages/Upload/Upload.js

import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  List as ListIcon,
  Article as ArticleIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  Legend as RechartLegend,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import axios from 'axios';
import './upload.css';

const STEPS = ['Upload Resume', 'Job Description', 'Results'];
const COLORS = ['#1976d2', '#00ab55', '#ffb300', '#f44336', '#7c4dff', '#0097a7'];

// hard-coded URLs:
const API_URL = 'https://smart-resume-backend-6ggk.onrender.com';
const AI_URL  = 'https://smart-resume-ai-2.onrender.com';

export default function Upload() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback(e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      setStep(1);
    }
  }, []);

  const onFileSelect = e => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setStep(1);
    }
  };

  const uploadResume = async resumeFile => {
    const form = new FormData();
    form.append('file', resumeFile);
    const resp = await axios.post(
      `${API_URL}/api/analysis/upload-resume`,
      form
    );
    return resp.data; // resumePath
  };

  const analyze = async e => {
    e.preventDefault();
    if (!file || !jobDesc.trim()) return;
    setError('');
    setLoading(true);

    try {
      // 1) upload the file
      const resumePath = await uploadResume(file);

      // 2) hit the AI service
      const aiForm = new FormData();
      aiForm.append('resume', file);
      aiForm.append('job_description', jobDesc);
      const { data: aiData } = await axios.post(
        `${AI_URL}/api/v1/analyze`,
        aiForm
      );

      // 3) save & fetch back
      const payload = { ...aiData, resumePath };
      const { data: saved } = await axios.post(
        `${API_URL}/api/analysis`,
        payload
      );

      setAnalysis(saved);
      setStep(2);

    } catch (err) {
      console.error(err);
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const safeMap = (arr, fn) => (Array.isArray(arr) ? arr.map(fn) : []);

  const ScoreDonut = () => {
    const data = [
      { name: 'Fit',       value: analysis?.overallFitScore  ?? 0 },
      { name: 'Semantic',  value: analysis?.semanticScore    ?? 0 },
      { name: 'TF-IDF',    value: analysis?.tfidfScore       ?? 0 },
      { name: 'Skills',    value: analysis?.skillScore       ?? 0 },
      { name: 'Experience',value: analysis?.experienceScore  ?? 0 },
      { name: 'Education', value: analysis?.educationScore   ?? 0 },
    ];
    return (
      <Box>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={4}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <RechartLegend verticalAlign="bottom" height={32} />
            <RechartTooltip formatter={v => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
        <Box className="score-metrics" aria-label="Score details">
          {data.map((score, index) => (
            <Box className="score-metric" key={score.name}>
              <Box
                className="score-swatch"
                sx={{ backgroundColor: COLORS[index % COLORS.length] }}
                aria-hidden="true"
              />
              <Typography component="span">{score.name}</Typography>
              <Typography component="strong">{score.value}%</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const SkillsBar = () => {
    const data = [
      { name: 'Matched', count: analysis?.matchedSkills?.length ?? 0 },
      { name: 'Missing', count: analysis?.missingSkills?.length ?? 0 },
    ];
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 14 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 14 }} />
          <RechartTooltip />
          <Bar dataKey="count" radius={[6,6,0,0]} barSize={50}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Container maxWidth="md" className="upload-container">
      <Box component="header" className="upload-header">
        <Typography className="eyebrow">AI-powered candidate review</Typography>
        <Typography component="h1" variant="h3" className="upload-title">
          Resume analysis
        </Typography>
        <Typography className="upload-subtitle">
          Compare a resume with a job description and get a structured fit assessment.
        </Typography>
      </Box>

      {step < 2 && (
        <Paper elevation={0} className="stepper-wrapper" aria-label="Analysis progress">
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

      {step === 0 && (
        <Paper
          elevation={0}
          className={`upload-zone ${file ? 'uploaded' : ''}`}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          aria-labelledby="upload-zone-title"
          aria-describedby="upload-formats"
        >
          <Box className="zone-icon-wrap" aria-hidden="true">
            <CloudUploadIcon className="zone-icon" />
          </Box>
          <Typography id="upload-zone-title" component="h2" variant="h5">
            Upload your resume
          </Typography>
          <Typography className="zone-copy">
            Drag and drop a file here, or choose one from your device.
          </Typography>
          <Typography id="upload-formats" className="file-guidance">
            PDF, DOC, or DOCX
          </Typography>
          <label htmlFor="resume-file" className="file-picker-label">
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.doc,.docx"
              className="visually-hidden"
              aria-label="Choose resume file"
              onChange={onFileSelect}
            />
            <Button variant="contained" component="span" size="large">
              Choose resume file
            </Button>
          </label>
          {file && <Typography className="file-name">{file.name}</Typography>}
        </Paper>
      )}

      {step === 1 && (
        <Paper elevation={0} className="job-form-wrapper">
          <Box className="form-heading">
            <Typography component="h2" variant="h5">Add the job description</Typography>
            <Typography>
              The analysis compares the selected resume with the role requirements below.
            </Typography>
            <Chip label={file?.name} size="small" className="selected-file" />
          </Box>
          <form onSubmit={analyze} className="job-form" aria-busy={loading}>
            <TextField
              label="Job description"
              variant="outlined"
              fullWidth
              multiline
              minRows={7}
              required
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              helperText="Include responsibilities, required skills, and experience for the best comparison."
            />
            {error && (
              <Alert severity="error" role="alert" className="analysis-alert">
                {error}
              </Alert>
            )}
            {loading && (
              <Typography role="status" className="loading-status">
                Analyzing the resume against this role. This may take a moment.
              </Typography>
            )}
            <Box className="form-actions">
              <Button onClick={() => setStep(0)} disabled={loading}>Back</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                startIcon={loading && <CircularProgress size={18} color="inherit" aria-hidden="true" />}
              >
                {loading ? 'Analyzing resume' : 'Analyze resume'}
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {step === 2 && analysis && (
        <Box className="results-section" aria-labelledby="results-title">
          <Box className="results-header">
            <Box>
              <Typography className="eyebrow">Analysis complete</Typography>
              <Typography id="results-title" component="h2" variant="h4">
                Candidate fit report
              </Typography>
              <Typography>
                A structured comparison of the resume and job description.
              </Typography>
            </Box>
            <Box className="overall-score" aria-label={`Overall fit score ${analysis.overallFitScore ?? 0} percent`}>
              <Typography className="score-value">{analysis.overallFitScore ?? 0}%</Typography>
              <Typography className="score-label">Overall fit</Typography>
            </Box>
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card className="result-card">
                <CardContent>
                  <Typography component="h3" variant="h6" gutterBottom className="section-title">
                    <PieChartIcon fontSize="small" /> Score Breakdown
                  </Typography>
                  <ScoreDonut />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card className="result-card">
                <CardContent>
                  <Typography component="h3" variant="h6" gutterBottom className="section-title">
                    <BarChartIcon fontSize="small" /> Skills Overview
                  </Typography>
                  <SkillsBar />
                  <Box mt={2}>
                    <Typography variant="subtitle2">
                      <CheckIcon color="success" /> Matched
                    </Typography>
                    {safeMap(analysis.matchedSkills, (s, i) => (
                      <Chip key={i} label={s} color="success" className="chip" />
                    ))}
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      <CancelIcon color="error" /> Missing
                    </Typography>
                    {safeMap(analysis.missingSkills, (s, i) => (
                      <Chip key={i} label={s} color="error" className="chip" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Candidate info cards */}
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {[
              {
                icon: <PersonIcon />,
                label: 'Candidate',
                value: analysis.candidateName
              },
              {
                icon: <EmailIcon />,
                label: 'Email',
                value: analysis.candidateEmail
              },
              {
                icon: <PhoneIcon />,
                label: 'Phone',
                value: analysis.phoneNumber
              },
              {
                icon: <WorkIcon />,
                label: 'Category',
                value: analysis.fitCategory
              }
            ].map((info, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card className="info-card">
                  <CardContent>
                    <Avatar className="info-avatar">{info.icon}</Avatar>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      {info.label}
                    </Typography>
                    <Typography className="info-value">{info.value || 'Not provided'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Work Experience */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              <TimelineIcon fontSize="small" /> Work Experience
            </Typography>
            <Grid container spacing={2}>
              {safeMap(analysis.workExperiences, (job, i) => (
                <Grid item xs={12} key={i}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {job.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {job.company}
                      </Typography>
                      <Typography variant="body2">
                        {job.startDate} – {job.isCurrent ? 'Present' : job.endDate}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Education */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              <SchoolIcon fontSize="small" /> Education
            </Typography>
            <Grid container spacing={2}>
              {safeMap(analysis.educationDetails, (edu, i) => (
                <Grid item xs={12} key={i}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {edu.degree}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {edu.institution}
                      </Typography>
                      <Typography variant="body2">
                        {edu.startDate
                          ? `${edu.startDate} – ${
                              edu.isCurrent ? 'Present' : edu.endDate
                            }`
                          : `End: ${edu.endDate}`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Summary, strengths, weaknesses, fit explanation */}
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <ArticleIcon fontSize="small" /> Candidate Summary
                  </Typography>
                  <Typography>{analysis.summary}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <ListIcon fontSize="small" /> Strengths
                  </Typography>
                  <ul className="bullet-list">
                    {safeMap(analysis.strengths, (s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <ListIcon fontSize="small" /> Weaknesses
                  </Typography>
                  <ul className="bullet-list">
                    {safeMap(analysis.weaknesses, (w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <ListIcon fontSize="small" /> Fit Explanation
                  </Typography>
                  <Typography>{analysis.fitExplanation}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
}
