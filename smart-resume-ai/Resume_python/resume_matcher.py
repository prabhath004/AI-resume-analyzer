import os
import re
import tempfile
import logging
import warnings
from datetime import datetime
from typing import Set, Dict, List, Any
import json
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

import spacy
import numpy as np
import pdfplumber
import dateparser
from docx import Document
from dateutil.relativedelta import relativedelta
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from spacy.matcher import PhraseMatcher
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# -------------------- OpenAI (only for strengths/weaknesses) --------------------
import openai
raw_key = os.getenv("OPENAI_API_KEY", "")
clean_key = raw_key.replace("\u2011", "-").strip()
openai.api_key = clean_key

# suppress non-critical warnings
warnings.filterwarnings("ignore", category=UserWarning, module="skillNer")
warnings.filterwarnings("ignore", message="CropBox missing from /Page")

# SkillNer imports
from skillNer.skill_extractor_class import SkillExtractor
from skillNer.general_params import SKILL_DB

# -------------------- STORAGE --------------------
class Storage:
    def __init__(self):
        self.data_dir = Path("data")
        self.data_dir.mkdir(exist_ok=True)
        self.candidates_file = self.data_dir / "candidates.json"
        self.analysis_file   = self.data_dir / "analysis.json"
        self.candidates      = self._load(self.candidates_file)
        self.analysis        = self._load(self.analysis_file)

    def _load(self, path: Path) -> list:
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except:
                return []
        return []

    def _save(self, data: list, path: Path):
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def add_candidate(self, info: dict):
        info["timestamp"] = datetime.now().isoformat()
        self.candidates.append(info)
        self._save(self.candidates, self.candidates_file)

    def add_analysis(self, info: dict):
        info["timestamp"] = datetime.now().isoformat()
        self.analysis.append(info)
        self._save(self.analysis, self.analysis_file)

storage = Storage()

# -------------------- APP & LOGGING --------------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Resume Analyzer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- SKILL MAP --------------------
SKILL_MAP = {
    "javascript": {"terms": {"javascript", "js", "javascript frameworks"}},
    "react":      {"terms": {"react", "react.js", "reactjs"}},
    "node":       {"terms": {"node", "node.js", "nodejs"}},
    "typescript": {"terms": {"typescript", "ts"}},
    "aws":        {"terms": {"aws", "amazon web services"}},
    "docker":     {"terms": {"docker", "containerization"}},
    "kubernetes": {"terms": {"kubernetes", "k8s"}},
    "postgresql": {"terms": {"postgres", "postgresql"}},
    "mongodb":    {"terms": {"mongodb", "mongo"}},
    "jest":       {"terms": {"jest", "jest framework"}},
    "pytest":     {"terms": {"pytest", "python test"}},
    "oauth":      {"terms": {"oauth", "oauth2"}},
    "jwt":        {"terms": {"jwt", "json web token"}},
    "rest":       {"terms": {"rest api", "restful", "rest"}},
    "ci/cd":      {"terms": {"ci/cd", "continuous integration", "github actions"}},
    "graphql":    {"terms": {"graphql", "gql"}},
    "python":     {"terms": {"python", "py"}},
    "java":       {"terms": {"java"}},
    "qa":         {"terms": {"qa", "quality assurance", "testing"}},
    "object-oriented design": {"terms": {"object-oriented design", "oop", "object oriented programming"}},
}

# -------------------- NLP MODELS --------------------
try:
    nlp = spacy.load("en_core_web_md")
except IOError:
    raise RuntimeError("Please install spaCy model: python -m spacy download en_core_web_md")

skill_extractor = SkillExtractor(nlp, SKILL_DB, PhraseMatcher)
embedder       = SentenceTransformer("all-mpnet-base-v2")
tfidf          = TfidfVectorizer(stop_words="english", ngram_range=(1,3), max_features=5000)

# -------------------- EDUCATION --------------------
def compute_education_score(res_edu: Set[str], jd_edu: Set[str]) -> float:
    rank = {"bachelor":1, "master":2, "phd":3}
    if not jd_edu: return 1.0
    req = max(rank.get(x,0) for x in jd_edu)
    if not res_edu: return 0.0
    got = max(rank.get(x,0) for x in res_edu)
    return min(got/req, 1.0)

# — degree keywords (B.S., Bachelor, M.S., Master, Ph.D., etc.)
_DEGREE_KEYWORD_RE = re.compile(
    r"\b(b\.?s\.?|bachelor|m\.?s\.?|master|ph\.?d\.?)\b",
    re.IGNORECASE
)
# — degree keywords
_DEGREE_KEYWORD_RE = re.compile(
    r"\b(b\.?s\.?|bachelor|m\.?s\.?|master|ph\.?d\.?)\b",
    re.IGNORECASE
)

# — full range: "Aug 2022 – May 2026" or "Present"
_DATE_RANGE_RE = re.compile(
    r"(?P<start>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{4})"
    r"\s*[-–—]\s*"
    r"(?P<end>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{4}"
      r"|Present|Current)",
    re.IGNORECASE
)

# — expected graduation only: "Expected Graduation: May 2026"
_EXPECTED_GRAD_RE = re.compile(
    r"Expected\s+Graduation[:\s]+(?P<end>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
    r"\w*\.?\s+\d{4})",
    re.IGNORECASE
)

def extract_education(text: str) -> List[str]:
    """
    Grab every non-blank, non-bullet, non-'Relevant Courses' line
    between the 'Education' header and the next major section.
    """
    lines = text.splitlines()
    # 1) find "Education"
    try:
        start = next(i for i, ln in enumerate(lines)
                     if re.match(r"(?i)^\s*education\b", ln))
    except StopIteration:
        return []
    # 2) find end of that section
    end = next((j for j in range(start+1, len(lines))
                if re.match(r"(?i)^\s*(experience|projects|certifications|skills|technical skills)\b",
                            lines[j])),
               len(lines))
    block = [ln.strip() for ln in lines[start+1:end]]
    # 3) drop bullets and "Relevant Courses" lines
    return [
        ln for ln in block
        if ln
           and not ln.startswith(("•","-"))
           and not re.match(r"(?i)^\s*(relevant courses|technical skills)", ln)
    ]

def extract_education_details(text: str) -> List[Dict[str,Any]]:
    """
    Find every line with a degree keyword, pair it with the line above
    as institution, parse dates (full range or expected graduation),
    and return structured entries.
    """
    lines = extract_education(text)
    results = []
    now = datetime.now()

    for idx, ln in enumerate(lines):
        # only care about lines that mention B.S., Bachelor, M.S., Ph.D., etc.
        if not _DEGREE_KEYWORD_RE.search(ln):
            continue

        # institution is the previous line (or empty if missing)
        inst_line = lines[idx-1].strip() if idx>0 else ""
        deg_line  = ln.strip()

        # 1) Try full range on deg_line, then on inst_line
        m = _DATE_RANGE_RE.search(deg_line) or _DATE_RANGE_RE.search(inst_line)
        sd = ed = None
        is_current = False

        if m:
            sd_text, ed_text = m.group("start"), m.group("end")
            sd = dateparser.parse(sd_text, settings={"PREFER_DAY_OF_MONTH":"first"})
            if re.search(r"(?i)present|current", ed_text):
                ed, is_current = now, True
            else:
                ed = dateparser.parse(ed_text, settings={"PREFER_DAY_OF_MONTH":"first"})
        else:
            # 2) Fallback to Expected Graduation
            e = _EXPECTED_GRAD_RE.search(deg_line)
            if not e:
                # no valid dates → skip
                continue
            ed = dateparser.parse(e.group("end"), settings={"PREFER_DAY_OF_MONTH":"first"})
            is_current = True

        # Clean out the date text from inst_line or deg_line
        if m and m.re is _DATE_RANGE_RE and m.string is inst_line:
            inst_clean = inst_line[:m.start()].rstrip(", ").strip()
        else:
            inst_clean = inst_line

        if m and m.re is _DATE_RANGE_RE and m.string is deg_line:
            deg_clean = deg_line[:m.start()].rstrip(", ").strip()
        elif not m and e:
            deg_clean = _EXPECTED_GRAD_RE.sub("", deg_line).rstrip(", ").strip()
        else:
            deg_clean = deg_line

        results.append({
            "institution": inst_clean,
            "degree":      deg_clean,
            "startDate":   sd.date().isoformat() if sd else None,
            "endDate":     ed.date().isoformat() if ed else None,
            "isCurrent":   is_current
        })

    return results


# -------------------- TEXT EXTRACTION --------------------
def extract_text(file: UploadFile) -> str:
    temp = None
    try:
        ext = file.filename.split(".")[-1].lower()
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(file.file.read())
            temp = tmp.name

        if ext=="pdf":
            text = []
            with pdfplumber.open(temp) as pdf:
                for pg in pdf.pages:
                    txt = pg.extract_text()
                    if txt:
                        text.append(txt)
            full = "\n".join(text)

        elif ext=="docx":
            doc = Document(temp)
            full = "\n".join(p.text for p in doc.paragraphs)

        else:
            raise HTTPException(400, "Unsupported file type")

        return re.sub(r"[ \t]+"," ", full).strip().lower()

    except Exception as e:
        logger.error(f"extract_text error: {e}")
        raise HTTPException(400, "File processing failed")

    finally:
        if temp:
            try: os.unlink(temp)
            except: pass

# -------------------- SKILL EXTRACTION --------------------
def extract_skills(text: str) -> Set[str]:
    skills = set()
    cleaned = re.sub(r"[^a-zA-Z0-9+/]"," ", text)
    # keyword match
    for can,info in SKILL_MAP.items():
        for term in info["terms"]:
            if re.search(rf"\b{re.escape(term)}\b", cleaned, re.IGNORECASE):
                skills.add(can)
                break
    # advanced NER + matcher
    try:
        doc = nlp(text)
        ann = skill_extractor.annotate(text)
        for m in ann.get("results",{}).get("full_matches",[]):
            if "value" in m:
                skills.add(m["value"].lower())
        for ent in doc.ents:
            if ent.label_ in {"ORG","PRODUCT"} and len(ent.text)<20:
                skills.add(ent.text.lower())
    except Exception as e:
        logger.error(f"extract_skills error: {e}")

    return {s for s in skills if len(s.split())<=3}

def normalize_skills(sk: Set[str]) -> Set[str]:
    out = set()
    for s in sk:
        for can,info in SKILL_MAP.items():
            if s.lower() in (t.lower() for t in info["terms"]):
                out.add(can)
                break
        else:
            out.add(s)
    return out

# 1) Capture "Mon YYYY – Mon YYYY" or "Mon YYYY – Present"
_DATE_RANGE_RE = re.compile(
    r"(?P<start>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{4})"
    r"\s*[-–—]\s*"
    r"(?P<end>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{4}"
      r"|Present|Current)",
    re.IGNORECASE
)

# 2) Skip lines that look like project/publication bullets
_SKIP_PROJECT = re.compile(
    r"\b(project|publication|certificat|workshop|journal|coursework)\b",
    re.IGNORECASE
)

nlp = spacy.load("en_core_web_md")
embedder = SentenceTransformer("all-mpnet-base-v2")

def extract_work_experience_block(text: str) -> List[str]:
    """
    Returns only the lines between the 'Experience' header
    and the next major section (Education, Projects, Certifications, Skills).
    """
    lines = text.splitlines()
    start_idx = None

    # 3a) find the "Experience" header
    for i, ln in enumerate(lines):
        if re.match(r"(?i)^\s*(?:professional\s+)?(?:work\s+)?experience\b", ln):
            start_idx = i + 1
            break
    if start_idx is None:
        return []

    # 3b) find where that section ends
    end_idx = len(lines)
    for j in range(start_idx, len(lines)):
        if re.match(r"(?i)^\s*(education|projects|certifications|skills)\b", lines[j]):
            end_idx = j
            break

    # 3c) return non-empty, stripped lines
    return [ln.strip() for ln in lines[start_idx:end_idx] if ln.strip()]

def extract_all_jobs(text: str) -> List[Dict[str, Any]]:
    """
    Scan those lines for each date-range, then pull title + company.
    """
    lines = extract_work_experience_block(text)
    now = datetime.now()
    jobs: List[Dict[str, Any]] = []

    for idx, ln in enumerate(lines):
        m = _DATE_RANGE_RE.search(ln)
        if not m:
            continue

        # skip project/publication snippets
        if _SKIP_PROJECT.search(ln):
            continue

        # parse start/end dates
        sd = dateparser.parse(m.group("start"), settings={"PREFER_DAY_OF_MONTH":"first"})
        end_str = m.group("end")
        if re.search(r"present|current", end_str, re.IGNORECASE):
            ed, is_current = now, True
        else:
            ed, is_current = dateparser.parse(end_str, settings={"PREFER_DAY_OF_MONTH":"first"}), False

        if not sd or not ed or sd > ed:
            continue

        # 4a) title is everything before the dates on that line
        title = ln[:m.start()].strip(" -–—•")

        # 4b) company is the very next non-bullet, non-tools line
        company = ""
        for nxt in lines[idx+1:]:
            n = nxt.strip()
            if not n:
                continue
            # skip bullets and tools lines
            if n.startswith("•") or n.startswith("-") or n.lower().startswith("tools"):
                continue
            # if it has a date, it's the next entry—stop
            if _DATE_RANGE_RE.search(n):
                break
            company = n
            break

        # 4c) fallback: NER for ORG if still empty
        if not company:
            doc = nlp(ln)
            orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
            company = orgs[0] if orgs else ""

        jobs.append({
            "title":      title,
            "company":    company,
            "startDate":  sd.date().isoformat(),
            "endDate":    ed.date().isoformat(),
            "isCurrent":  bool(is_current)
        })

    # most-recent first
    jobs.sort(key=lambda j: j["endDate"] or "", reverse=True)
    return jobs

def calculate_experience(text: str) -> float:
    """
    Sum up each job's span and return total years (1 decimal).
    """
    total_months = 0
    for job in extract_all_jobs(text):
        s = datetime.fromisoformat(job["startDate"])
        e = datetime.now() if job["isCurrent"] else datetime.fromisoformat(job["endDate"])
        delta = relativedelta(e, s)
        total_months += delta.years * 12 + delta.months
    return round(total_months / 12, 1)

def calculate_experience_relevance(resume_text: str, jd_text: str) -> float:
    """
    Semantic similarity between the full experience block & the JD.
    """
    block = "\n".join(extract_work_experience_block(resume_text))
    clean = re.sub(r"\s+", " ", block)
    emb_r = embedder.encode(clean)
    emb_j = embedder.encode(jd_text)
    return float(np.clip(cosine_similarity([emb_r], [emb_j])[0][0], 0, 1))

# -------------------- SEMANTIC SCORING --------------------
def calculate_similarity(resume: str, jd: str) -> Dict[str,float]:
    # boost keywords
    terms = "|".join(re.escape(k) for k in SKILL_MAP)
    r2 = re.sub(rf"\b({terms})\b", r"\1 \1", resume, flags=re.IGNORECASE)
    j2 = re.sub(rf"\b({terms})\b", r"\1 \1", jd, flags=re.IGNORECASE)

    emb_r = embedder.encode(r2)
    emb_j = embedder.encode(j2)
    sem   = np.clip(cosine_similarity([emb_r],[emb_j])[0][0],0,1)

    tf = tfidf.fit_transform([r2,j2])
    tfidf_sim = np.clip(cosine_similarity(tf[0:1],tf[1:2])[0][0],0,1)

    return {"semantic": sem, "tfidf": tfidf_sim}



def compute_ats_score(comps: Dict[str,float]) -> float:
    w = {"experience":0.45, "semantic":0.20, "skills":0.20, "education":0.10, "tfidf":0.05}
    return sum(w[k]*comps[k] for k in w)

# -------------------- CONTACT INFO --------------------
def extract_contact_info(text: str) -> Dict[str,str]:
    info = {"name":"","email":"","phone":"","current_position":"","current_company":""}
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if lines:
        info["name"] = re.sub(r"[^A-Za-z\s-]","", lines[0]).title()
    em = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text)
    info["email"] = em.group(0) if em else ""
    ph = re.search(r"\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b", text.replace(" ",""))
    info["phone"] = re.sub(r"[^\d+]","",ph.group(0)) if ph else ""
    return info

def extract_first_json_block(s: str) -> str:
    """Return the first {...} JSON substring found in s (balanced braces)."""
    start = s.find("{")
    if start < 0:
        return None
    depth = 0
    for i, ch in enumerate(s[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return s[start:i+1]
    return None
# -------------------- API ROUTE --------------------
@app.post("/api/v1/analyze")
async def analyze_resume(resume: UploadFile, job_description: str = Form(...)):
    try:
        # 1) extract text, 2) contact, 3) skills
        rtxt  = extract_text(resume)
        jtxt  = re.sub(r"\s+"," ", job_description).strip().lower()
        contact = extract_contact_info(rtxt)
        res_sk  = normalize_skills(extract_skills(rtxt))
        jd_sk   = normalize_skills(extract_skills(jtxt))
        matched = res_sk & jd_sk
        missing = jd_sk - res_sk
        skill_ratio = len(matched)/ (len(jd_sk) or 1)

        # 4) education
        edu_score = compute_education_score(extract_education(rtxt), extract_education(jtxt))

        # 5) experience
        duration    = calculate_experience(rtxt)
        exp_rel     = calculate_experience_relevance(rtxt, jtxt)

        # 6) similarity
        sims = calculate_similarity(rtxt,jtxt)

        # 7) aggregate
        comps = {
            "experience": exp_rel,
            "semantic":   sims["semantic"],
            "skills":     skill_ratio,
            "education":  edu_score,
            "tfidf":      sims["tfidf"]
        }
        fit = round(compute_ats_score(comps)*100, 2)

        # 8) fit category
        if   fit>=90: cat="Excellent"
        elif fit>=80: cat="Very Good"
        elif fit>=70: cat="Good"
        elif fit>=55: cat="Fair"
        elif fit>=40: cat="Partial"
        else:         cat="Poor"

        summary_sw = {"summary": "", "strengths": [], "weaknesses": [], "fitExplanation": ""}
        try:
            # pull out the structured education details
            ed_details = extract_education_details(rtxt)

            prompt = (
                "You are an ATS assistant. "
                "Based on these details, return a JSON object with keys:\n"
                "  • summary            – 1–2 sentence overview of the candidate\n"
                "  • strengths          – list exactly three concise strengths\n"
                "  • weaknesses         – list exactly three concise weaknesses\n"
                "  • fitExplanation     – a 2–3 sentence rationale of their fit for the role\n\n"
                f"Matched Skills: {', '.join(sorted(matched))}\n"
                f"Missing Skills: {', '.join(sorted(missing))}\n"
                f"Fit Category : {cat}\n"
                f"Overall Score: {fit}\n"
                f"Total Experience: {duration:.1f} years\n\n"
                "Here are the structured education entries (institution, degree, startDate, endDate, isCurrent):\n"
                f"{json.dumps(ed_details, indent=2)}\n\n"
                "IMPORTANT: If any entry has \"isCurrent\": true, describe the candidate as a *current student* "
                "pursuing that degree rather than a graduate.\n"
            )

            resp = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
            )
            ai_content = resp.choices[0].message.content.strip()
            jsn = extract_first_json_block(ai_content)
            if jsn:
                data = json.loads(jsn)
                summary_sw["summary"]        = data.get("summary", "")
                summary_sw["strengths"]      = data.get("strengths", [])
                summary_sw["weaknesses"]     = data.get("weaknesses", [])
                summary_sw["fitExplanation"] = data.get("fitExplanation", "")
        except Exception as e:
            logger.error(f"OpenAI summary error: {e}")

        # 10) assemble response — NO 'educationlevel'
        result = {
            "candidateName":    contact["name"],
            "candidateEmail":   contact["email"],
            "phoneNumber":      contact["phone"],
            "workExperiences":  extract_all_jobs(rtxt),
            "overallFitScore":  fit,
            "semanticScore":    round(sims["semantic"]*100,2),
            "tfidfScore":       round(sims["tfidf"]*100,2),
            "skillScore":       round(skill_ratio*100,2),
            "experienceScore":  round(exp_rel*100,2),
            "educationScore":   round(edu_score*100,2),
            "matchedSkills":    sorted(matched),
            "missingSkills":    sorted(missing),
            "experience":       f"{duration:.1f} years",
            "educationDetails": extract_education_details(rtxt),  # ONLY this is kept
            "fitCategory":      cat,
            **summary_sw
        }

        # 11) persist & reply
        storage.add_candidate({
            "id":         str(len(storage.candidates)+1),
            "name":       contact["name"],
            "email":      contact["email"],
            "score":      fit,
            "skillsMatch": skill_ratio*100,
            "status":     cat
        })
        storage.add_analysis(result)
        return JSONResponse(result)

    except Exception as e:
        logger.error(f"API error: {e}")
        return JSONResponse({"error":str(e)}, status_code=500)

@app.get("/api/v1/ping")
def ping():
    return JSONResponse({"status":"AI Service is healthy"})

if __name__=="__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
