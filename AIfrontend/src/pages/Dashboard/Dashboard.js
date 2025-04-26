// src/pages/Dashboard/Dashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Grid, Card, CardContent, CardActions,
  IconButton, Popover, ClickAwayListener, Divider, List, ListItem,
  ListItemText, Chip, Stack
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as ScoreIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import './dashboard.css';

const API_URL = 'https://smart-resume-backend-6ggk.onrender.com'; 
const COLORS = ['#1976d2', '#00ab55', '#ffb300', '#f44336', '#7c4dff', '#0097a7'];

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // fetch existing analyses
    axios.get(`${API_URL}/api/analysis`)
      .then(res => setResumes(res.data.map(r => Resume.fromRaw(r))))
      .catch(() => alert('Failed to load dashboard.'));

    // setup WebSocket for live updates
    const sock = new SockJS(`${API_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 5000,
    });
    client.onConnect = () => {
      client.subscribe('/topic/analyses', msg => {
        const raw = JSON.parse(msg.body);
        setResumes(prev => [
          Resume.fromRaw(raw),
          ...prev.filter(r => r.id !== raw.id)
        ]);
      });
    };
    client.activate();
    return () => client.deactivate();
  }, []);

  const handleDelete = useCallback(id => {
    axios.delete(`${API_URL}/api/analysis/${id}`)
      .then(() => setResumes(r => r.filter(x => x.id !== id)))
      .catch(() => alert('Delete failed.'));
  }, []);

  const handleDownload = useCallback(fileName => {
    window.open(`${API_URL}/api/analysis/download-resume/${fileName}`, '_blank');
  }, []);

  const openPopover = (e, analysis) => {
    setAnchorEl(e.currentTarget);
    setSelected(analysis);
  };
  const closePopover = () => {
    setAnchorEl(null);
    setSelected(null);
  };
  const popoverOpen = Boolean(anchorEl);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Live Dashboard</Typography>
        <IconButton color="primary" onClick={() => window.location.href = '/upload'}>
          <UploadIcon />
          <Typography ml={1}>Upload New</Typography>
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {resumes.map(r => (
          <Grid item key={r.id} xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">{r.candidateName}</Typography>
                <Box display="flex" alignItems="center" mt={1} mb={1}>
                  <ScoreIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography>{r.overallFitScore.toFixed(1)}%</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(r.createdAt).toLocaleString()}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton onClick={e => openPopover(e, r)}><ViewIcon /></IconButton>
                <IconButton onClick={() => handleDownload(r.resumePath)}><DownloadIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(r.id)}><DeleteIcon /></IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { width: 440, maxHeight: 650, p: 2 } }}
      >
        <ClickAwayListener onClickAway={closePopover}>
          <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{selected?.candidateName}</Typography>
              <IconButton size="small" onClick={closePopover}><CloseIcon /></IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {selected?.candidateEmail} | {selected?.phoneNumber}
            </Typography>
            <Divider sx={{ my: 1 }} />

            {/* Mini Charts */}
            <Box display="flex" gap={2}>
              <Box flex={1}>
                <Typography variant="subtitle2" align="center">Fit Breakdown</Typography>
                <ScoreDonutMini analysis={selected} />
              </Box>
              <Box flex={1}>
                <Typography variant="subtitle2" align="center">Skills Coverage</Typography>
                <SkillsBarMini analysis={selected} />
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />

            {/* Summary & Fit Explanation */}
            <Box mb={2}>
              <Typography variant="subtitle2">Summary</Typography>
              <Typography variant="body2">{selected?.summary}</Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="subtitle2">Fit Explanation</Typography>
              <Typography variant="body2">{selected?.fitExplanation}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />

            {/* Strengths & Weaknesses */}
            <Grid container spacing={2} mb={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Strengths</Typography>
                <List dense>
                  {selected?.strengths?.map((s, i) => (
                    <ListItem key={i}><ListItemText primary={s} /></ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Weaknesses</Typography>
                <List dense>
                  {selected?.weaknesses?.map((w, i) => (
                    <ListItem key={i}><ListItemText primary={w} /></ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />

            {/* Education */}
            <Box mb={2}>
              <Typography variant="subtitle2">Education</Typography>
              <List dense>
                {selected?.educationDetails?.length > 0 ? (
                  selected.educationDetails.map((ed, i) => (
                    <ListItem key={i}>
                      <ListItemText
                        primary={ed.degree}
                        secondary={`${ed.institution} — ${ed.startDate} to ${ed.isCurrent ? 'Present' : ed.endDate}`}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2">—</Typography>
                )}
              </List>
            </Box>
            <Divider sx={{ my: 2 }} />

            {/* Work Experience */}
            <Box mb={2}>
              <Typography variant="subtitle2">Work Experience</Typography>
              <List dense>
                {selected?.workExperiences?.map((we, i) => (
                  <ListItem key={i}>
                    <ListItemText
                      primary={`${we.title} @ ${we.company}`}
                      secondary={`${we.startDate} — ${we.isCurrent ? 'Present' : we.endDate}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Skills Chips */}
            <Box>
              <Typography variant="subtitle2">Matched Skills</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} mb={1}>
                {selected?.matchedSkills?.map((s, i) => (
                  <Chip key={i} label={s} color="success" size="small" />
                ))}
              </Stack>
              <Typography variant="subtitle2">Missing Skills</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {selected?.missingSkills?.map((s, i) => (
                  <Chip key={i} label={s} color="warning" size="small" />
                ))}
              </Stack>
            </Box>
          </Box>
        </ClickAwayListener>
      </Popover>
    </Container>
  );
}

// Small donut for popover
function ScoreDonutMini({ analysis }) {
  const data = [
    { name: 'Fit', value: analysis?.overallFitScore },
    { name: 'Semantic', value: analysis?.semanticScore },
    { name: 'TF-IDF', value: analysis?.tfidfScore },
    { name: 'Skills', value: analysis?.skillScore },
    { name: 'Experience', value: analysis?.experienceScore },
    { name: 'Education', value: analysis?.educationScore },
  ];
  return (
    <ResponsiveContainer width="100%" height={100}>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={24} outerRadius={40} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Pie>
        <RechartTooltip formatter={v => `${v}%`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Small bar for popover
function SkillsBarMini({ analysis }) {
  const data = [
    { name: 'Matched', count: analysis?.matchedSkills?.length || 0 },
    { name: 'Missing', count: analysis?.missingSkills?.length || 0 },
  ];
  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ left: 0, right: 0 }}>
        <XAxis dataKey="name" hide />
        <YAxis hide />
        <RechartTooltip />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Normalize raw API response
class Resume {
  static fromRaw(raw) {
    return {
      ...raw,
      createdAt: raw.createdAt,
      educationDetails: raw.educationDetails || [],
      workExperiences: raw.workExperiences || [],
      strengths: raw.strengths || [],
      weaknesses: raw.weaknesses || [],
      matchedSkills: raw.matchedSkills || [],
      missingSkills: raw.missingSkills || []
    };
  }
}
