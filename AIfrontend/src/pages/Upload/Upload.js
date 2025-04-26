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
  Divider
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
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            label={({ name, value }) => `${name}: ${value}%`}
            labelLine={false}
            paddingAngle={4}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <RechartLegend verticalAlign="bottom" height={36} />
          <RechartTooltip formatter={v => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
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
      <Typography variant="h3" align="center" gutterBottom>
        Smart Resume Screener
      </Typography>

      {step < 2 && (
        <Paper elevation={0} className="stepper-wrapper">
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
          elevation={3}
          className={`upload-zone ${file ? 'uploaded' : ''}`}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
        >
          <CloudUploadIcon className="zone-icon" />
          <Typography variant="h6">Drag & Drop your resume here</Typography>
          <Typography variant="body2" color="textSecondary">or</Typography>
          <label htmlFor="resume-file">
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.doc,.docx"
              hidden
              onChange={onFileSelect}
            />
            <Button variant="outlined" component="span">
              Browse Files
            </Button>
          </label>
          {file && <Typography className="file-name">{file.name}</Typography>}
        </Paper>
      )}

      {step === 1 && (
        <Paper elevation={3} className="job-form-wrapper">
          <form onSubmit={analyze} className="job-form">
            <TextField
              label="Paste Job Description"
              variant="outlined"
              fullWidth
              multiline
              rows={6}
              required
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
            />
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Box className="form-actions">
              <Button onClick={() => setStep(0)}>Back</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                Analyze
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {step === 2 && analysis && (
        <Box className="results-section">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PieChartIcon fontSize="small" /> Score Breakdown
                  </Typography>
                  <ScoreDonut />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
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
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card>
                  <CardContent>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{info.icon}</Avatar>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      {info.label}
                    </Typography>
                    <Typography>{info.value}</Typography>
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
