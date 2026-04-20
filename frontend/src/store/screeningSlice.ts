import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { authHeader } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL;

export interface ScoreBreakdown {
  skillsMatch: number;
  experienceRelevance: number;
  educationFit: number;
  overallRelevance: number;
}

export interface InterviewQuestion {
  question: string;
  rationale: string;
  area: "technical" | "behavioral" | "gap_probe" | "cultural_fit";
}

export interface RankedCandidate {
  rank: number;
  applicantId: string;
  candidateName: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  documentStatus: "sufficient" | "partial" | "insufficient";
  documentNotes?: string;
  interviewQuestions?: InterviewQuestion[];
  recruiterFeedback?: "accepted" | "rejected" | null;
}

export interface BiasFlag {
  type: string;
  description: string;
  affectedCandidates?: number[];
  severity: "info" | "warning" | "critical";
}

export interface BiasAudit {
  riskLevel: "low" | "medium" | "high";
  flags: BiasFlag[];
  overallAssessment: string;
}

export interface ScreeningResult {
  _id: string;
  jobId: string;
  triggeredAt: string;
  shortlistSize: 10 | 20;
  shortlist: RankedCandidate[];
  biasAudit: BiasAudit;
  status: "pending" | "completed" | "failed";
  errorMessage?: string;
  progress?: { total: number; completed: number };
  candidateProgress?: Array<{
    candidateName: string;
    status: "analyzing" | "completed";
    overallScore?: number;
    recommendation?: string;
  }>;
  analysisStats?: { total: number; scored: number; insufficientDocs: number };
}

interface ScreeningState {
  current: ScreeningResult | null;
  history: ScreeningResult[];
  polling: boolean;
  pendingScreeningId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ScreeningState = {
  current: null,
  history: [],
  polling: false,
  pendingScreeningId: null,
  loading: false,
  error: null,
};

export const triggerScreening = createAsyncThunk(
  "screening/trigger",
  async ({ jobId, shortlistSize }: { jobId: string; shortlistSize: 10 | 20 }) => {
    const res = await axios.post(
      `${API}/screening/trigger`,
      { jobId, shortlistSize },
      { headers: { Authorization: authHeader() } }
    );
    return res.data.data as { screeningId: string; status: string };
  }
);

export const pollScreening = createAsyncThunk(
  "screening/poll",
  async (screeningId: string) => {
    const res = await axios.get(`${API}/screening/${screeningId}`, {
      headers: { Authorization: authHeader() },
    });
    return res.data.data as ScreeningResult;
  }
);

export const fetchScreeningHistory = createAsyncThunk(
  "screening/history",
  async (jobId: string) => {
    const res = await axios.get(`${API}/screening/job/${jobId}`, {
      headers: { Authorization: authHeader() },
    });
    return res.data.data as ScreeningResult[];
  }
);

export const submitFeedback = createAsyncThunk(
  "screening/feedback",
  async ({
    screeningId,
    rank,
    feedback,
  }: {
    screeningId: string;
    rank: number;
    feedback: "accepted" | "rejected";
  }) => {
    await axios.post(
      `${API}/feedback`,
      { screeningId, rank, feedback },
      { headers: { Authorization: authHeader() } }
    );
    return { screeningId, rank, feedback };
  }
);

const screeningSlice = createSlice({
  name: "screening",
  initialState,
  reducers: {
    setPolling(state, action: PayloadAction<boolean>) {
      state.polling = action.payload;
    },
    clearScreening(state) {
      state.current = null;
      state.error = null;
      state.polling = false;
      state.pendingScreeningId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(triggerScreening.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.current = null;
        state.pendingScreeningId = null;
      })
      .addCase(triggerScreening.fulfilled, (state, action) => {
        state.loading = false;
        state.polling = true;
        state.pendingScreeningId = action.payload.screeningId;
      })
      .addCase(triggerScreening.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Screening failed to start";
      })
      .addCase(pollScreening.fulfilled, (state, action) => {
        state.current = action.payload;
        if (action.payload.status !== "pending") {
          state.polling = false;
          state.pendingScreeningId = null;
        }
      })
      .addCase(fetchScreeningHistory.fulfilled, (state, action) => {
        state.history = action.payload;
        if (action.payload.length > 0) {
          state.current = action.payload[0];
        }
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        if (!state.current) return;
        const candidate = state.current.shortlist.find(
          (c) => c.rank === action.payload.rank
        );
        if (candidate) candidate.recruiterFeedback = action.payload.feedback;
      });
  },
});

export const { setPolling, clearScreening } = screeningSlice.actions;
export default screeningSlice.reducer;
